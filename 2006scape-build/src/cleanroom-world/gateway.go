package world

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"github.com/coder/websocket"
)

type Gateway struct {
	World      World
	MaxClients int
	sequence   atomic.Uint64
	active     atomic.Int64
}

func NewGateway(world World) (*Gateway, error) {
	if err := world.Validate(); err != nil {
		return nil, fmt.Errorf("gateway world rejected: %w", err)
	}
	return &Gateway{World: world, MaxClients: 128}, nil
}

func (g *Gateway) Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/session/v1" {
			http.NotFound(w, r)
			return
		}
		if g.MaxClients > 0 && g.active.Load() >= int64(g.MaxClients) {
			http.Error(w, "gateway at capacity", http.StatusServiceUnavailable)
			return
		}
		g.active.Add(1)
		defer g.active.Add(-1)
		conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{OriginPatterns: []string{"localhost", "127.0.0.1", "[::1]"}})
		if err != nil {
			return
		}
		conn.SetReadLimit(MaxFrameBytes)
		defer conn.Close(websocket.StatusNormalClosure, "session closed")
		g.serve(conn)
	})
}

type gatewaySession struct {
	id               string
	player           Player
	locationRevision uint64
	inventory        InventoryState
	bank             BankState
	resources        map[string]ResourceNodeState
	cooldowns        map[string]int64
	receipts         map[string][]byte
}

func (g *Gateway) serve(conn *websocket.Conn) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, data, err := conn.Read(ctx)
	if err != nil {
		return
	}
	envelope, err := decodeEnvelope(data)
	if err != nil || envelope.Type != "admission.request" {
		g.writeError(conn, context.Background(), envelope.RequestID, "invalid-admission", "the first frame must be a valid admission request")
		return
	}
	var admission AdmissionPayload
	if err := strictJSON(envelope.Payload, &admission); err != nil || admission.Ticket != "local-dev-ticket" || admission.ClientBuild == "" {
		g.writeError(conn, context.Background(), envelope.RequestID, "admission-rejected", "admission ticket or client build was rejected")
		return
	}
	session := &gatewaySession{
		id:               fmt.Sprintf("session-%d", g.sequence.Add(1)),
		player:           Player{ID: fmt.Sprintf("player-%d", g.sequence.Load()), Tile: Tile{X: 6, Y: 8, LevelID: "welcome-garden-ground"}, Facing: "south"},
		locationRevision: 1,
		inventory:        InventoryState{},
		bank:             NewBankState(),
		resources:        WelcomeResourceNodes(),
		cooldowns:        map[string]int64{},
		receipts:         map[string][]byte{},
	}
	if err := g.writeSnapshot(conn, context.Background(), envelope.RequestID, "admission.accepted", session); err != nil {
		return
	}
	for {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		_, data, err := conn.Read(ctx)
		cancel()
		if err != nil {
			return
		}
		envelope, err := decodeEnvelope(data)
		if err != nil {
			g.writeError(conn, context.Background(), "", "invalid-frame", "frame rejected by protocol validation")
			continue
		}
		if err := g.handleEnvelope(conn, session, envelope); err != nil {
			g.writeError(conn, context.Background(), envelope.RequestID, errorCode(err), safeMessage(err))
		}
	}
}

func (g *Gateway) handleEnvelope(conn *websocket.Conn, session *gatewaySession, envelope WireEnvelope) error {
	if receipt, ok := session.receipts[envelope.RequestID]; ok {
		return conn.Write(context.Background(), websocket.MessageText, receipt)
	}
	switch envelope.Type {
	case "move.request":
		var payload MovePayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-move-payload: %w", err)
		}
		if payload.ExpectedLocationRevision != session.locationRevision {
			return fmt.Errorf("stale-location")
		}
		if payload.KnownGraphRevision != g.World.GraphRevision {
			return fmt.Errorf("stale-graph")
		}
		destination, err := step(session.player.Tile, payload.Direction)
		if err != nil {
			return err
		}
		cell, ok := g.World.Levels[session.player.Tile.LevelID].CellAt(destination)
		if !ok || !cell.Walkable {
			return fmt.Errorf("blocked-destination")
		}
		session.player.Tile = destination
		session.player.Facing = strings.ToLower(payload.Direction)
		session.locationRevision++
		return g.writeSnapshot(conn, context.Background(), envelope.RequestID, "snapshot", session)
	case "traverse.request":
		var payload TraversePayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-traverse-payload: %w", err)
		}
		if payload.ExpectedLocationRevision != session.locationRevision {
			return fmt.Errorf("stale-location")
		}
		result, err := g.World.Traverse(session.player, TraverseIntent{CommandID: envelope.RequestID, ConnectorID: payload.ConnectorID, ClientGraphRevision: payload.KnownGraphRevision})
		if err != nil {
			return err
		}
		session.player.Tile = result.To
		session.player.TransitionRevision = result.TransitionRevision
		session.locationRevision++
		return g.writeSnapshot(conn, context.Background(), envelope.RequestID, "snapshot", session)
	case "resource.harvest":
		var payload HarvestPayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-harvest-payload: %w", err)
		}
		node, ok := session.resources[payload.NodeID]
		if !ok {
			return fmt.Errorf("node-not-found")
		}
		if distance(session.player.Tile, node.Tile) > 2 {
			return fmt.Errorf("out-of-range")
		}
		lastHarvest := int64(-1 << 62)
		if recorded, exists := session.cooldowns[payload.NodeID]; exists {
			lastHarvest = recorded
		}
		result, err := Harvest(node, payload.Tool, payload.SkillLevel, payload.NowSeconds, lastHarvest)
		if err != nil {
			return err
		}
		if _, exists := session.inventory[result.ItemID]; !exists && len(session.inventory) >= InventoryCapacity {
			return fmt.Errorf("inventory-full")
		}
		session.inventory[result.ItemID] += int64(result.Quantity)
		session.cooldowns[payload.NodeID] = payload.NowSeconds
		data, err := encodeEnvelope(envelope.RequestID, "resource.harvested", HarvestReceipt{ItemID: result.ItemID, Quantity: result.Quantity, Inventory: session.inventory, ResourceCooldowns: session.cooldowns})
		if err != nil {
			return err
		}
		session.receipts[envelope.RequestID] = data
		return conn.Write(context.Background(), websocket.MessageText, data)
	case "bank.tab.select":
		var payload BankTabPayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-bank-tab-payload: %w", err)
		}
		if err := session.bank.SelectTab(payload.Tab); err != nil {
			return err
		}
		return g.writeSnapshot(conn, context.Background(), envelope.RequestID, "snapshot", session)
	case "bank.deposit":
		var payload BankItemPayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-bank-payload: %w", err)
		}
		if distance(session.player.Tile, Tile{X: 7, Y: 8, LevelID: "welcome-garden-ground"}) > 3 {
			return fmt.Errorf("bank-not-found")
		}
		if payload.Tab != session.bank.ActiveTab {
			return fmt.Errorf("stale-bank-tab")
		}
		if session.inventory[payload.ItemID] < payload.Quantity {
			return fmt.Errorf("insufficient-quantity")
		}
		if err := session.bank.Deposit(payload.ItemID, payload.Quantity); err != nil {
			return err
		}
		session.inventory[payload.ItemID] -= payload.Quantity
		if session.inventory[payload.ItemID] == 0 {
			delete(session.inventory, payload.ItemID)
		}
		return g.writeSnapshot(conn, context.Background(), envelope.RequestID, "snapshot", session)
	case "bank.withdraw":
		var payload BankItemPayload
		if err := strictJSON(envelope.Payload, &payload); err != nil {
			return fmt.Errorf("invalid-bank-payload: %w", err)
		}
		if distance(session.player.Tile, Tile{X: 7, Y: 8, LevelID: "welcome-garden-ground"}) > 3 {
			return fmt.Errorf("bank-not-found")
		}
		if payload.Tab != session.bank.ActiveTab {
			return fmt.Errorf("stale-bank-tab")
		}
		if _, exists := session.inventory[payload.ItemID]; !exists && len(session.inventory) >= InventoryCapacity {
			return fmt.Errorf("inventory-full")
		}
		if err := session.bank.Withdraw(payload.ItemID, payload.Quantity, payload.Tab); err != nil {
			return err
		}
		session.inventory[payload.ItemID] += payload.Quantity
		return g.writeSnapshot(conn, context.Background(), envelope.RequestID, "snapshot", session)
	default:
		return fmt.Errorf("unknown-message-type")
	}
}

func step(from Tile, direction string) (Tile, error) {
	to := from
	switch strings.ToLower(direction) {
	case "north":
		to.Y--
	case "east":
		to.X++
	case "south":
		to.Y++
	case "west":
		to.X--
	default:
		return Tile{}, fmt.Errorf("invalid-direction")
	}
	return to, nil
}

func distance(a, b Tile) int {
	dx := a.X - b.X
	if dx < 0 {
		dx = -dx
	}
	dy := a.Y - b.Y
	if dy < 0 {
		dy = -dy
	}
	if dx > dy {
		return dx
	}
	return dy
}

func (g *Gateway) writeSnapshot(conn *websocket.Conn, ctx context.Context, requestID, messageType string, session *gatewaySession) error {
	payload := SessionSnapshot{SessionID: session.id, PlayerID: session.player.ID, WorldSpace: "copper-lantern-realm-01", LevelID: session.player.Tile.LevelID, Tile: TilePayload{X: session.player.Tile.X, Y: session.player.Tile.Y, LevelID: session.player.Tile.LevelID}, Facing: session.player.Facing, LocationRevision: session.locationRevision, TransitionRevision: session.player.TransitionRevision, GraphRevision: g.World.GraphRevision, Inventory: session.inventory, ResourceCooldowns: session.cooldowns, Bank: session.bank}
	data, err := encodeEnvelope(requestID, messageType, payload)
	if err != nil {
		return err
	}
	if requestID != "" {
		session.receipts[requestID] = append([]byte(nil), data...)
	}
	return conn.Write(ctx, websocket.MessageText, data)
}

func (g *Gateway) writeError(conn *websocket.Conn, ctx context.Context, requestID, code, message string) error {
	data, err := encodeEnvelope(requestID, "error", ErrorPayload{Code: code, Message: message})
	if err != nil {
		return err
	}
	return conn.Write(ctx, websocket.MessageText, data)
}

func errorCode(err error) string {
	if err == nil {
		return "unknown"
	}
	parts := strings.SplitN(err.Error(), ":", 2)
	return parts[0]
}

func safeMessage(err error) string {
	if err == nil {
		return "request rejected"
	}
	return err.Error()
}

func WelcomeGardenWorld() World {
	levels := map[string]Level{}
	for _, spec := range []struct {
		id            string
		width, height int
	}{{"welcome-garden-ground", 64, 81}, {"welcome-garden-upper", 64, 81}} {
		cells := make(map[[2]int]Cell, spec.width*spec.height)
		for x := 0; x < spec.width; x++ {
			for y := 0; y < spec.height; y++ {
				cells[[2]int{x, y}] = Cell{Walkable: true, Support: FloorSupport, Clearance: 3}
			}
		}
		levels[spec.id] = Level{ID: spec.id, Width: spec.width, Height: spec.height, Cells: cells}
	}
	levels["welcome-garden-upper"] = Level{ID: "welcome-garden-upper", Width: 64, Height: 81, Cells: func() map[[2]int]Cell {
		cells := make(map[[2]int]Cell, 64*81)
		for x := 0; x < 64; x++ {
			for y := 0; y < 81; y++ {
				cells[[2]int{x, y}] = Cell{Walkable: true, Support: PortalLanding, Clearance: 3}
			}
		}
		return cells
	}()}
	return World{Levels: levels, Connectors: map[string]Connector{
		"welcome-stair-up": {ID: "welcome-stair-up", Kind: Stairs, From: Tile{X: 8, Y: 8, LevelID: "welcome-garden-ground"}, To: Tile{X: 8, Y: 8, LevelID: "welcome-garden-upper"}, Open: true, RequiredClearance: 2, Bidirectional: true},
	}, GraphRevision: 1}
}
