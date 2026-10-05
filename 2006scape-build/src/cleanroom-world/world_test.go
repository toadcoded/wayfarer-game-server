package world

import "testing"

func testWorld() World {
	cell := func(s SupportKind, clearance int) Cell { return Cell{Walkable: true, Support: s, Clearance: clearance} }
	levels := map[string]Level{
		"ground": {ID: "ground", Width: 4, Height: 4, Cells: map[[2]int]Cell{
			{1, 1}: cell(FloorSupport, 3), {2, 1}: cell(FloorSupport, 3),
		}},
		"upper": {ID: "upper", Width: 4, Height: 4, Cells: map[[2]int]Cell{
			{1, 1}: cell(PortalLanding, 3),
		}},
		"cellar": {ID: "cellar", Width: 4, Height: 4, Cells: map[[2]int]Cell{
			{2, 1}: cell(PortalLanding, 2),
		}},
	}
	connectors := map[string]Connector{
		"stairs-up":     {ID: "stairs-up", Kind: Stairs, From: Tile{1, 1, "ground"}, To: Tile{1, 1, "upper"}, Open: true, RequiredClearance: 2, Bidirectional: true},
		"trapdoor-down": {ID: "trapdoor-down", Kind: Trapdoor, From: Tile{2, 1, "ground"}, To: Tile{2, 1, "cellar"}, Open: true, RequiredClearance: 2, Bidirectional: true},
	}
	return World{Levels: levels, Connectors: connectors, GraphRevision: 7}
}

func TestValidateAndTraverseStairs(t *testing.T) {
	world := testWorld()
	if err := world.Validate(); err != nil {
		t.Fatalf("world should validate: %v", err)
	}
	result, err := world.Traverse(Player{ID: "p1", Tile: Tile{1, 1, "ground"}, TransitionRevision: 2}, TraverseIntent{
		CommandID: "cmd-1", ConnectorID: "stairs-up", ClientGraphRevision: 7,
	})
	if err != nil {
		t.Fatalf("stairs should traverse: %v", err)
	}
	if result.To.LevelID != "upper" || result.TransitionRevision != 3 {
		t.Fatalf("unexpected upstairs result: %+v", result)
	}
}

func TestTrapdoorRejectsStaleGraph(t *testing.T) {
	world := testWorld()
	_, err := world.Traverse(Player{Tile: Tile{2, 1, "ground"}}, TraverseIntent{
		CommandID: "cmd-2", ConnectorID: "trapdoor-down", ClientGraphRevision: 6,
	})
	if err == nil {
		t.Fatal("stale trapdoor command should reject")
	}
}

func TestLockedDoorRejects(t *testing.T) {
	world := testWorld()
	world.Connectors["trapdoor-down"] = Connector{
		ID: "trapdoor-down", Kind: Door, From: Tile{2, 1, "ground"}, To: Tile{2, 1, "cellar"},
		Open: false, Locked: true, RequiredClearance: 2,
	}
	if _, err := world.Traverse(Player{Tile: Tile{2, 1, "ground"}}, TraverseIntent{
		CommandID: "cmd-3", ConnectorID: "trapdoor-down", ClientGraphRevision: 7,
	}); err == nil {
		t.Fatal("locked door should reject")
	}
}

func TestInvalidConnectorFailsWorldValidation(t *testing.T) {
	world := testWorld()
	world.Connectors["bad-rope"] = Connector{
		ID: "bad-rope", Kind: Rope, From: Tile{1, 1, "ground"}, To: Tile{3, 3, "missing"},
		Open: true, RequiredClearance: 1, VerticalSpan: 2, MinSpan: 1, MaxSpan: 2,
	}
	if err := world.Validate(); err == nil {
		t.Fatal("connector with unknown destination level should fail validation")
	}
}

func TestUnbackedWalkableCellFailsValidation(t *testing.T) {
	world := testWorld()
	level := world.Levels["ground"]
	level.Cells[[2]int{3, 3}] = Cell{Walkable: true, Clearance: 3}
	world.Levels["ground"] = level
	if err := world.Validate(); err == nil {
		t.Fatal("walkable unsupported cell should fail validation")
	}
}

func TestAllVerticalConnectorKindsValidate(t *testing.T) {
	testCases := []struct {
		name    string
		kind    ConnectorKind
		support SupportKind
	}{
		{"stairs", Stairs, FloorSupport},
		{"ramp", Ramp, RampSupport},
		{"ladder", Ladder, LadderSupport},
		{"rope", Rope, RopeSupport},
		{"trapdoor", Trapdoor, FloorSupport},
		{"crawl-space", CrawlSpace, CrawlSupport},
		{"tunnel", Tunnel, FloorSupport},
		{"hub", Hub, FloorSupport},
		{"dungeon-entrance", DungeonEntrance, FloorSupport},
		{"door", Door, FloorSupport},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			world := testWorld()
			ground := world.Levels["ground"]
			ground.Cells[[2]int{1, 1}] = Cell{Walkable: true, Support: tc.support, Clearance: 3}
			world.Levels["ground"] = ground
			world.Connectors = map[string]Connector{
				"test": {ID: "test", Kind: tc.kind, From: Tile{1, 1, "ground"}, To: Tile{1, 1, "upper"}, Open: true, RequiredClearance: 2, VerticalSpan: 2, MinSpan: 1, MaxSpan: 3},
			}
			if err := world.Validate(); err != nil {
				t.Fatalf("%s connector should validate: %v", tc.name, err)
			}
		})
	}
}

func TestUnknownConnectorKindFailsValidation(t *testing.T) {
	world := testWorld()
	world.Connectors["unknown"] = Connector{ID: "unknown", Kind: ConnectorKind("elevator-without-spec"), From: Tile{1, 1, "ground"}, To: Tile{1, 1, "upper"}, Open: true, RequiredClearance: 2}
	if err := world.Validate(); err == nil {
		t.Fatal("unknown connector kind should fail validation")
	}
}
