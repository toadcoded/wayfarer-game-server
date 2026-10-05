package world

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
)

const (
	ProtocolVersion = "session/v1"
	MaxFrameBytes   = 64 * 1024
)

type WireEnvelope struct {
	Version   string          `json:"version"`
	Type      string          `json:"type"`
	RequestID string          `json:"requestId"`
	Payload   json.RawMessage `json:"payload"`
}

type AdmissionPayload struct {
	Ticket      string `json:"ticket"`
	ClientBuild string `json:"clientBuild"`
}

type TilePayload struct {
	X       int    `json:"x"`
	Y       int    `json:"y"`
	LevelID string `json:"levelId"`
}

type SessionSnapshot struct {
	SessionID          string           `json:"sessionId"`
	PlayerID           string           `json:"playerId"`
	WorldSpace         string           `json:"worldSpace"`
	LevelID            string           `json:"levelId"`
	Tile               TilePayload      `json:"tile"`
	Facing             string           `json:"facing"`
	LocationRevision   uint64           `json:"locationRevision"`
	TransitionRevision uint64           `json:"transitionRevision"`
	GraphRevision      uint64           `json:"graphRevision"`
	Inventory          InventoryState   `json:"inventory"`
	ResourceCooldowns  map[string]int64 `json:"resourceCooldowns"`
	Bank               BankState        `json:"bank"`
}

type MovePayload struct {
	ExpectedLocationRevision uint64 `json:"expectedLocationRevision"`
	KnownGraphRevision       uint64 `json:"knownGraphRevision"`
	Direction                string `json:"direction"`
}

type TraversePayload struct {
	ConnectorID              string `json:"connectorId"`
	ExpectedLocationRevision uint64 `json:"expectedLocationRevision"`
	KnownGraphRevision       uint64 `json:"knownGraphRevision"`
}

type HarvestPayload struct {
	NodeID     string `json:"nodeId"`
	Tool       string `json:"tool"`
	SkillLevel int    `json:"skillLevel"`
	NowSeconds int64  `json:"nowSeconds"`
}

type BankTabPayload struct {
	Tab int `json:"tab"`
}
type BankItemPayload struct {
	ItemID   string `json:"itemId"`
	Quantity int64  `json:"quantity"`
	Tab      int    `json:"tab"`
}
type HarvestReceipt struct {
	ItemID            string           `json:"itemId"`
	Quantity          int              `json:"quantity"`
	Inventory         InventoryState   `json:"inventory"`
	ResourceCooldowns map[string]int64 `json:"resourceCooldowns"`
}

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func decodeEnvelope(data []byte) (WireEnvelope, error) {
	if len(data) == 0 || len(data) > MaxFrameBytes {
		return WireEnvelope{}, fmt.Errorf("frame exceeds protocol limit")
	}
	var envelope WireEnvelope
	if err := strictJSON(data, &envelope); err != nil {
		return WireEnvelope{}, fmt.Errorf("invalid envelope: %w", err)
	}
	if envelope.Version != ProtocolVersion || envelope.Type == "" || envelope.RequestID == "" || len(envelope.Payload) == 0 {
		return WireEnvelope{}, fmt.Errorf("invalid protocol envelope")
	}
	return envelope, nil
}

func strictJSON(data []byte, target any) error {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); err != io.EOF {
		return fmt.Errorf("trailing JSON data")
	}
	return nil
}

func encodeEnvelope(requestID, messageType string, payload any) ([]byte, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return json.Marshal(WireEnvelope{Version: ProtocolVersion, Type: messageType, RequestID: requestID, Payload: data})
}
