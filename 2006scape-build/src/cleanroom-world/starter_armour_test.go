package world

import "testing"

func TestNewCharacterCanClaimBrassArmorAtWelcomeTable(t *testing.T) {
	grant, err := ClaimWelcomeGardenBrassArmor(StarterArmorClaim{
		CommandID:   "armor-1",
		CharacterID: "dev-newcomer",
		AtTable:     true,
	})
	if err != nil {
		t.Fatalf("new character should receive starter armour: %v", err)
	}
	if grant.TableID != "welcome-garden-brass-armour-table" || grant.Material != "brushed-brass" || !grant.OneTime {
		t.Fatalf("unexpected armour grant: %+v", grant)
	}
	if len(grant.Pieces) != 4 {
		t.Fatalf("expected four brass armour pieces, got %d", len(grant.Pieces))
	}
}

func TestStarterArmorRequiresTableLocation(t *testing.T) {
	if _, err := ClaimWelcomeGardenBrassArmor(StarterArmorClaim{
		CommandID:   "armor-2",
		CharacterID: "dev-newcomer",
		AtTable:     false,
	}); err == nil {
		t.Fatal("claim away from the table should reject")
	}
}

func TestStarterArmorCanOnlyBeClaimedOnce(t *testing.T) {
	if _, err := ClaimWelcomeGardenBrassArmor(StarterArmorClaim{
		CommandID:      "armor-3",
		CharacterID:    "dev-returning",
		AtTable:        true,
		AlreadyClaimed: true,
	}); err == nil {
		t.Fatal("repeat starter armour claim should reject")
	}
}
