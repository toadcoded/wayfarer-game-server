package world

import "fmt"

type ConnectorKind string

const (
	Stairs          ConnectorKind = "stairs"
	Ramp            ConnectorKind = "ramp"
	Ladder          ConnectorKind = "ladder"
	Rope            ConnectorKind = "rope"
	Trapdoor        ConnectorKind = "trapdoor"
	CrawlSpace      ConnectorKind = "crawl-space"
	Tunnel          ConnectorKind = "tunnel"
	Hub             ConnectorKind = "hub"
	DungeonEntrance ConnectorKind = "dungeon-entrance"
	Door            ConnectorKind = "door"
)

type SupportKind string

const (
	FloorSupport  SupportKind = "floor"
	StairSupport  SupportKind = "stair"
	RampSupport   SupportKind = "ramp"
	LadderSupport SupportKind = "ladder"
	RopeSupport   SupportKind = "rope"
	CrawlSupport  SupportKind = "crawl"
	PortalLanding SupportKind = "portal-landing"
)

type Tile struct {
	X, Y    int
	LevelID string
}

func (t Tile) Equal(other Tile) bool {
	return t.X == other.X && t.Y == other.Y && t.LevelID == other.LevelID
}

type Cell struct {
	Walkable  bool
	Support   SupportKind
	Clearance int
}

type Level struct {
	ID     string
	Width  int
	Height int
	Cells  map[[2]int]Cell
}

func (l Level) CellAt(tile Tile) (Cell, bool) {
	if tile.LevelID != l.ID || tile.X < 0 || tile.Y < 0 || tile.X >= l.Width || tile.Y >= l.Height {
		return Cell{}, false
	}
	cell, ok := l.Cells[[2]int{tile.X, tile.Y}]
	return cell, ok
}

type Connector struct {
	ID                string
	Kind              ConnectorKind
	From              Tile
	To                Tile
	Open              bool
	Locked            bool
	RequiredClearance int
	VerticalSpan      int
	MinSpan           int
	MaxSpan           int
	Bidirectional     bool
}

type World struct {
	Levels        map[string]Level
	Connectors    map[string]Connector
	GraphRevision uint64
}

type Player struct {
	ID                 string
	Tile               Tile
	Facing             string
	TransitionRevision uint64
}

type TraverseIntent struct {
	CommandID           string
	ConnectorID         string
	ClientGraphRevision uint64
}

type TransitionResult struct {
	CommandID          string
	ConnectorID        string
	From               Tile
	To                 Tile
	GraphRevision      uint64
	TransitionRevision uint64
}

func (w World) Validate() error {
	if len(w.Levels) == 0 {
		return fmt.Errorf("world has no levels")
	}
	for id, level := range w.Levels {
		if id == "" || level.ID != id || level.Width <= 0 || level.Height <= 0 {
			return fmt.Errorf("invalid level %q", id)
		}
		for pos, cell := range level.Cells {
			if pos[0] < 0 || pos[1] < 0 || pos[0] >= level.Width || pos[1] >= level.Height {
				return fmt.Errorf("level %q has out-of-bounds cell", id)
			}
			if cell.Walkable && cell.Support == "" {
				return fmt.Errorf("walkable cell %q,%q on %q has no support", pos[0], pos[1], id)
			}
		}
	}
	for id, c := range w.Connectors {
		if id == "" || c.ID != id || c.From.LevelID == "" || c.To.LevelID == "" {
			return fmt.Errorf("connector %q has incomplete identity", id)
		}
		if !knownConnectorKind(c.Kind) {
			return fmt.Errorf("connector %q has unknown kind %q", id, c.Kind)
		}
		fromLevel, fromOK := w.Levels[c.From.LevelID]
		toLevel, toOK := w.Levels[c.To.LevelID]
		if !fromOK || !toOK {
			return fmt.Errorf("connector %q references an unknown level", id)
		}
		fromCell, fromOK := fromLevel.CellAt(c.From)
		toCell, toOK := toLevel.CellAt(c.To)
		if !fromOK || !toOK || !fromCell.Walkable || !toCell.Walkable {
			return fmt.Errorf("connector %q has an unsafe endpoint", id)
		}
		if toCell.Support != PortalLanding && c.Kind != Door {
			return fmt.Errorf("connector %q destination is not a portal landing", id)
		}
		span := c.VerticalSpan
		if c.Kind == Ladder || c.Kind == Rope {
			if c.MinSpan <= 0 || c.MaxSpan < c.MinSpan || span < c.MinSpan || span > c.MaxSpan {
				return fmt.Errorf("connector %q has invalid vertical span", id)
			}
		}
		if c.Kind == CrawlSpace && fromCell.Support != CrawlSupport {
			return fmt.Errorf("connector %q does not originate in a crawl-supported cell", id)
		}
		if c.Kind == Ramp && fromCell.Support != RampSupport {
			return fmt.Errorf("connector %q does not originate on ramp support", id)
		}
		if (c.Kind == Ladder && fromCell.Support != LadderSupport) || (c.Kind == Rope && fromCell.Support != RopeSupport) {
			return fmt.Errorf("connector %q has incompatible support", id)
		}
		if c.RequiredClearance <= 0 {
			return fmt.Errorf("connector %q has invalid clearance", id)
		}
		if fromCell.Clearance < c.RequiredClearance || toCell.Clearance < c.RequiredClearance {
			return fmt.Errorf("connector %q lacks clearance", id)
		}
	}
	return nil
}

func knownConnectorKind(kind ConnectorKind) bool {
	switch kind {
	case Stairs, Ramp, Ladder, Rope, Trapdoor, CrawlSpace, Tunnel, Hub, DungeonEntrance, Door:
		return true
	default:
		return false
	}
}

func (w World) Traverse(player Player, intent TraverseIntent) (TransitionResult, error) {
	if intent.CommandID == "" || intent.ConnectorID == "" {
		return TransitionResult{}, fmt.Errorf("invalid transition command")
	}
	if intent.ClientGraphRevision != w.GraphRevision {
		return TransitionResult{}, fmt.Errorf("stale graph revision")
	}
	connector, ok := w.Connectors[intent.ConnectorID]
	if !ok {
		return TransitionResult{}, fmt.Errorf("unknown connector")
	}
	if !connector.Open || connector.Locked {
		return TransitionResult{}, fmt.Errorf("connector unavailable")
	}
	if !player.Tile.Equal(connector.From) {
		return TransitionResult{}, fmt.Errorf("player is not at connector origin")
	}
	return TransitionResult{
		CommandID:          intent.CommandID,
		ConnectorID:        connector.ID,
		From:               connector.From,
		To:                 connector.To,
		GraphRevision:      w.GraphRevision,
		TransitionRevision: player.TransitionRevision + 1,
	}, nil
}

func abs(n int) int {
	if n < 0 {
		return -n
	}
	return n
}
