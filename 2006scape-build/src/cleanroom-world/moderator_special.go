package world

import "fmt"

type Role string

const (
	RolePlayer    Role = "player"
	RoleModerator Role = "moderator"
	RoleAdmin     Role = "admin"
)

type SpecialWeapon string

const GraniteMaul SpecialWeapon = "granite-maul"

type SpecialAttack string

const DoubleWhack SpecialAttack = "double-whack"

type SpecialIntent struct {
	CommandID string
	Role      Role
	Weapon    SpecialWeapon
	Attack    SpecialAttack
	TargetID  string
}

type SpecialResult struct {
	CommandID   string
	Weapon      SpecialWeapon
	Attack      SpecialAttack
	HitCount    int
	EnergyCost  int
	Unlimited   bool
	Authorizing Role
}

// ResolveModeratorSpecial is an authoritative policy function. The client may
// request the effect, but it cannot grant itself a role, weapon, hit count, or
// unlimited energy. Only a server-loaded moderator/admin role can use the
// unlimited double-whack policy.
func ResolveModeratorSpecial(intent SpecialIntent) (SpecialResult, error) {
	if intent.CommandID == "" || intent.TargetID == "" {
		return SpecialResult{}, fmt.Errorf("invalid special attack command")
	}
	if intent.Weapon != GraniteMaul {
		return SpecialResult{}, fmt.Errorf("special weapon is not authorized")
	}
	if intent.Attack != DoubleWhack {
		return SpecialResult{}, fmt.Errorf("special attack is not authorized")
	}
	if intent.Role != RoleModerator && intent.Role != RoleAdmin {
		return SpecialResult{}, fmt.Errorf("role is not authorized for unlimited special use")
	}
	return SpecialResult{
		CommandID:   intent.CommandID,
		Weapon:      GraniteMaul,
		Attack:      DoubleWhack,
		HitCount:    2,
		EnergyCost:  0,
		Unlimited:   true,
		Authorizing: intent.Role,
	}, nil
}
