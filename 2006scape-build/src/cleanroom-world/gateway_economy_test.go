package world

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func TestGatewayHarvestDepositWithdrawAndReplay(t *testing.T) {
	gateway, err := NewGateway(WelcomeGardenWorld())
	if err != nil {
		t.Fatal(err)
	}
	server := httptestServer(t, gateway.Handler())
	defer server.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, "ws"+server.URL[len("http"):]+"/session/v1", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "done")
	conn.SetReadLimit(MaxFrameBytes)
	writeEnvelope(t, conn, "admit", "admission.request", AdmissionPayload{Ticket: "local-dev-ticket", ClientBuild: "test"})
	readEnvelope(t, conn)
	writeEnvelope(t, conn, "harvest-1", "resource.harvest", HarvestPayload{NodeID: "resource-node-welcome-garden-0", Tool: "bronze-pickaxe", SkillLevel: 1, NowSeconds: 100})
	harvested := readEnvelope(t, conn)
	if harvested.Type != "resource.harvested" {
		t.Fatalf("expected harvest response, got %s", harvested.Type)
	}
	var receipt HarvestReceipt
	decodePayload(t, harvested.Payload, &receipt)
	if receipt.ItemID != "copper-ore" || receipt.Quantity < 1 {
		t.Fatalf("unexpected harvest receipt: %+v", receipt)
	}
	writeEnvelope(t, conn, "harvest-1", "resource.harvest", HarvestPayload{NodeID: "resource-node-welcome-garden-0", Tool: "bronze-pickaxe", SkillLevel: 1, NowSeconds: 100})
	replay := readEnvelope(t, conn)
	var replayReceipt HarvestReceipt
	decodePayload(t, replay.Payload, &replayReceipt)
	if replayReceipt.Quantity != receipt.Quantity {
		t.Fatal("replayed harvest changed its receipt")
	}
	writeEnvelope(t, conn, "deposit-1", "bank.deposit", BankItemPayload{ItemID: receipt.ItemID, Quantity: int64(receipt.Quantity), Tab: 0})
	deposited := readEnvelope(t, conn)
	if deposited.Type != "snapshot" {
		t.Fatalf("expected deposit snapshot, got %s", deposited.Type)
	}
	var snapshot SessionSnapshot
	decodePayload(t, deposited.Payload, &snapshot)
	if snapshot.Inventory[receipt.ItemID] != 0 {
		t.Fatalf("inventory was not emptied: %+v", snapshot.Inventory)
	}
	writeEnvelope(t, conn, "withdraw-1", "bank.withdraw", BankItemPayload{ItemID: receipt.ItemID, Quantity: 1, Tab: 0})
	withdrawn := readEnvelope(t, conn)
	decodePayload(t, withdrawn.Payload, &snapshot)
	if snapshot.Inventory[receipt.ItemID] != 1 {
		t.Fatalf("withdrawal did not return one item: %+v", snapshot.Inventory)
	}
}

// httptestServer is kept local to this test file to avoid exposing test-only helpers in production.
func httptestServer(t *testing.T, handler http.Handler) *httptest.Server {
	t.Helper()
	return httptest.NewServer(handler)
}
