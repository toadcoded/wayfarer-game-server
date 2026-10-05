package world

import "testing"

func TestModeratorGraniteMaulDoubleWhackIsUnlimited(t *testing.T) {
	result, err := ResolveModeratorSpecial(SpecialIntent{
		CommandID: "spec-1",
		Role:      RoleModerator,
		Weapon:    GraniteMaul,
		Attack:    DoubleWhack,
		TargetID:  "training-dummy",
	})
	if err != nil {
		t.Fatalf("moderator special should be accepted: %v", err)
	}
	if result.HitCount != 2 || result.EnergyCost != 0 || !result.Unlimited {
		t.Fatalf("unexpected moderator result: %+v", result)
	}
}

func TestAdminSharesModeratorSpecialPolicy(t *testing.T) {
	result, err := ResolveModeratorSpecial(SpecialIntent{
		CommandID: "spec-2",
		Role:      RoleAdmin,
		Weapon:    GraniteMaul,
		Attack:    DoubleWhack,
		TargetID:  "training-dummy",
	})
	if err != nil || result.Authorizing != RoleAdmin {
		t.Fatalf("admin should use the same guarded policy: %+v, %v", result, err)
	}
}

func TestRegularPlayerCannotUseUnlimitedSpecial(t *testing.T) {
	if _, err := ResolveModeratorSpecial(SpecialIntent{
		CommandID: "spec-3",
		Role:      RolePlayer,
		Weapon:    GraniteMaul,
		Attack:    DoubleWhack,
		TargetID:  "training-dummy",
	}); err == nil {
		t.Fatal("regular player should be rejected")
	}
}

func TestClientCannotChooseAnotherWeaponOrAttack(t *testing.T) {
	cases := []SpecialIntent{
		{CommandID: "spec-4", Role: RoleModerator, Weapon: "bronze-sword", Attack: DoubleWhack, TargetID: "dummy"},
		{CommandID: "spec-5", Role: RoleModerator, Weapon: GraniteMaul, Attack: "overhead-crush", TargetID: "dummy"},
	}
	for _, intent := range cases {
		if _, err := ResolveModeratorSpecial(intent); err == nil {
			t.Fatalf("unauthorized special should reject: %+v", intent)
		}
	}
}
