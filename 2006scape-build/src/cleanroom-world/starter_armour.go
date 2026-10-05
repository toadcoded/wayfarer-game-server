package world

import "fmt"

type StarterArmorPiece string

const (
	BrassHelm    StarterArmorPiece = "brass-helm"
	BrassPlate   StarterArmorPiece = "brass-plate"
	BrassGreaves StarterArmorPiece = "brass-greaves"
	BrassBoots   StarterArmorPiece = "brass-boots"
)

type StarterArmorClaim struct {
	CommandID      string
	CharacterID    string
	AtTable        bool
	AlreadyClaimed bool
}

type StarterArmorGrant struct {
	CommandID   string
	CharacterID string
	TableID     string
	Pieces      []StarterArmorPiece
	Material    string
	OneTime     bool
}

// ClaimWelcomeGardenBrassArmor is intentionally small and transactional in
// shape: the persistence layer must pass the durable AlreadyClaimed value and
// commit the returned grant together with its command receipt. The client can
// show the table, but cannot mark the claim as complete by itself.
func ClaimWelcomeGardenBrassArmor(claim StarterArmorClaim) (StarterArmorGrant, error) {
	if claim.CommandID == "" || claim.CharacterID == "" {
		return StarterArmorGrant{}, fmt.Errorf("invalid starter armour claim")
	}
	if !claim.AtTable {
		return StarterArmorGrant{}, fmt.Errorf("character is not at the starter armour table")
	}
	if claim.AlreadyClaimed {
		return StarterArmorGrant{}, fmt.Errorf("starter armour has already been claimed")
	}
	return StarterArmorGrant{
		CommandID:   claim.CommandID,
		CharacterID: claim.CharacterID,
		TableID:     "welcome-garden-brass-armour-table",
		Pieces:      []StarterArmorPiece{BrassHelm, BrassPlate, BrassGreaves, BrassBoots},
		Material:    "brushed-brass",
		OneTime:     true,
	}, nil
}
