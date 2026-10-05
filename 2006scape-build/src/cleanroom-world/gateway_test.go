package world

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func TestGatewayAdmissionAndMovement(t *testing.T) {
	gateway, err := NewGateway(WelcomeGardenWorld())
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(gateway.Handler())
	defer server.Close()
	connectionURL := "ws" + server.URL[len("http"):] + "/session/v1"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, connectionURL, nil)
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadLimit(MaxFrameBytes)
	defer conn.Close(websocket.StatusNormalClosure, "test done")

	writeEnvelope(t, conn, "admission-1", "admission.request", AdmissionPayload{Ticket: "local-dev-ticket", ClientBuild: "test"})
	admission := readEnvelope(t, conn)
	if admission.Type != "admission.accepted" {
		t.Fatalf("expected admission accepted, got %s", admission.Type)
	}
	var snapshot SessionSnapshot
	decodePayload(t, admission.Payload, &snapshot)
	if snapshot.Tile.X != 6 || snapshot.Tile.Y != 8 || snapshot.LocationRevision != 1 {
		t.Fatalf("unexpected admission snapshot: %+v", snapshot)
	}

	writeEnvelope(t, conn, "move-1", "move.request", MovePayload{ExpectedLocationRevision: 1, KnownGraphRevision: 1, Direction: "east"})
	moved := readEnvelope(t, conn)
	if moved.Type != "snapshot" {
		t.Fatalf("expected movement snapshot, got %s", moved.Type)
	}
	decodePayload(t, moved.Payload, &snapshot)
	if snapshot.Tile.X != 7 || snapshot.Tile.Y != 8 || snapshot.LocationRevision != 2 {
		t.Fatalf("unexpected movement snapshot: %+v", snapshot)
	}

	writeEnvelope(t, conn, "move-stale", "move.request", MovePayload{ExpectedLocationRevision: 1, KnownGraphRevision: 1, Direction: "east"})
	stale := readEnvelope(t, conn)
	if stale.Type != "error" {
		t.Fatalf("expected stale error, got %s", stale.Type)
	}
	var failure ErrorPayload
	decodePayload(t, stale.Payload, &failure)
	if failure.Code != "stale-location" {
		t.Fatalf("unexpected error: %+v", failure)
	}
}

func TestGatewayRejectsUnknownEnvelopeFields(t *testing.T) {
	gateway, err := NewGateway(WelcomeGardenWorld())
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(gateway.Handler())
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, "ws"+server.URL[len("http"):]+"/session/v1", nil)
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadLimit(MaxFrameBytes)
	defer conn.Close(websocket.StatusNormalClosure, "test done")
	data, _ := json.Marshal(map[string]any{"version": ProtocolVersion, "type": "admission.request", "requestId": "bad", "payload": AdmissionPayload{Ticket: "local-dev-ticket", ClientBuild: "test"}, "unexpected": true})
	if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
	_, response, err := conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var envelope WireEnvelope
	if err := json.Unmarshal(response, &envelope); err != nil {
		t.Fatal(err)
	}
	if envelope.Type != "error" {
		t.Fatalf("expected protocol error, got %s", envelope.Type)
	}
}

func writeEnvelope(t *testing.T, conn *websocket.Conn, requestID, messageType string, payload any) {
	t.Helper()
	data, err := encodeEnvelope(requestID, messageType, payload)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := conn.Write(ctx, websocket.MessageText, data); err != nil {
		t.Fatal(err)
	}
}

func readEnvelope(t *testing.T, conn *websocket.Conn) WireEnvelope {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, data, err := conn.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	envelope, err := decodeEnvelope(data)
	if err != nil {
		t.Fatal(err)
	}
	return envelope
}

func decodePayload(t *testing.T, data json.RawMessage, target any) {
	t.Helper()
	if err := strictJSON(data, target); err != nil {
		t.Fatal(err)
	}
}
