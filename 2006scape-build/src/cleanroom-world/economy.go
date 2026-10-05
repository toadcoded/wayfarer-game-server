package world

import (
	"fmt"
	"strings"
)

const (
	InventoryCapacity = 28
	BankTabCount      = 9
	BankSlotsPerTab   = 80
)

type ResourceNodeState struct {
	ID             string
	ResourceID     string
	Tile           Tile
	RequiredTool   string
	RequiredLevel  int
	YieldItem      string
	MinYield       int
	MaxYield       int
	RespawnSeconds int
}

type HarvestResult struct {
	ItemID         string `json:"itemId"`
	Quantity       int    `json:"quantity"`
	RespawnSeconds int    `json:"respawnSeconds"`
}

type resourceDefinition struct {
	id, tool, item           string
	level, min, max, respawn int
	tile                     Tile
}

var welcomeResources = []resourceDefinition{
	{id: "resource-node-welcome-garden-0", tool: "bronze-pickaxe", item: "copper-ore", level: 1, min: 1, max: 2, respawn: 45, tile: Tile{X: 5, Y: 8, LevelID: "welcome-garden-ground"}},
	{id: "resource-node-welcome-garden-1", tool: "spade", item: "clay", level: 1, min: 1, max: 3, respawn: 35, tile: Tile{X: 9, Y: 8, LevelID: "welcome-garden-ground"}},
}

func WelcomeResourceNodes() map[string]ResourceNodeState {
	nodes := make(map[string]ResourceNodeState, len(welcomeResources))
	for _, definition := range welcomeResources {
		nodes[definition.id] = ResourceNodeState{ID: definition.id, ResourceID: definition.id, Tile: definition.tile, RequiredTool: definition.tool, RequiredLevel: definition.level, YieldItem: definition.item, MinYield: definition.min, MaxYield: definition.max, RespawnSeconds: definition.respawn}
	}
	return nodes
}

func Harvest(node ResourceNodeState, tool string, skillLevel int, nowSeconds int64, lastHarvestSeconds int64) (HarvestResult, error) {
	if node.ID == "" {
		return HarvestResult{}, fmt.Errorf("node-not-found")
	}
	if nowSeconds-lastHarvestSeconds < int64(node.RespawnSeconds) {
		return HarvestResult{}, fmt.Errorf("cooldown")
	}
	if tool != node.RequiredTool {
		return HarvestResult{}, fmt.Errorf("tool-required")
	}
	if skillLevel < node.RequiredLevel {
		return HarvestResult{}, fmt.Errorf("level-required")
	}
	span := node.MaxYield - node.MinYield + 1
	quantity := node.MinYield
	if span > 1 {
		quantity += int((hash32(fmt.Sprintf("%s:%d", node.ID, nowSeconds)) % uint32(span)))
	}
	return HarvestResult{ItemID: node.YieldItem, Quantity: quantity, RespawnSeconds: node.RespawnSeconds}, nil
}

func hash32(value string) uint32 {
	var hash uint32 = 2166136261
	for _, character := range value {
		hash ^= uint32(character)
		hash *= 16777619
	}
	return hash
}

var stackableItems = map[string]bool{"coins": true, "copper-ore": true, "clay": true, "lobster": true, "rune-essence": true}

func isStackable(itemID string) bool { return stackableItems[itemID] }

type BankSlotState struct {
	ItemID      string `json:"itemId,omitempty"`
	Quantity    int64  `json:"quantity"`
	Noted       bool   `json:"noted"`
	Placeholder bool   `json:"placeholder"`
}
type BankTabState struct {
	ID    int             `json:"id"`
	Label string          `json:"label"`
	Slots []BankSlotState `json:"slots"`
}
type BankState struct {
	Open           bool           `json:"open"`
	SearchQuery    string         `json:"searchQuery"`
	ActiveTab      int            `json:"activeTab"`
	NoteMode       bool           `json:"noteMode"`
	Tabs           []BankTabState `json:"tabs"`
	TotalUsedSlots int            `json:"totalUsedSlots"`
	TotalFreeSlots int            `json:"totalFreeSlots"`
	TotalItemCount int64          `json:"totalItemCount"`
}

type InventoryState map[string]int64

func NewBankState() BankState {
	bank := BankState{Tabs: make([]BankTabState, BankTabCount)}
	for tab := range bank.Tabs {
		bank.Tabs[tab] = BankTabState{ID: tab, Label: func() string {
			if tab == 0 {
				return "Main"
			}
			return fmt.Sprintf("Tab %d", tab+1)
		}(), Slots: make([]BankSlotState, BankSlotsPerTab)}
	}
	bank.Deposit("coins", 2500)
	bank.Deposit("brass-armour", 1)
	bank.Deposit("granite-maul", 1)
	bank.Deposit("lobster", 12)
	bank.Deposit("copper-lantern", 1)
	return bank
}

func (b *BankState) recalculate() {
	b.TotalUsedSlots = 0
	b.TotalItemCount = 0
	for _, tab := range b.Tabs {
		for _, slot := range tab.Slots {
			if slot.Quantity > 0 {
				b.TotalUsedSlots++
			}
			b.TotalItemCount += slot.Quantity
		}
	}
	b.TotalFreeSlots = BankTabCount*BankSlotsPerTab - b.TotalUsedSlots
}
func (b *BankState) Deposit(itemID string, quantity int64) error {
	if quantity <= 0 {
		return fmt.Errorf("invalid-quantity")
	}
	if !isStackable(itemID) && quantity != 1 {
		return fmt.Errorf("item-not-stackable")
	}
	if b.ActiveTab < 0 || b.ActiveTab >= BankTabCount {
		return fmt.Errorf("invalid-tab")
	}
	tab := &b.Tabs[b.ActiveTab]
	for i := range tab.Slots {
		if tab.Slots[i].ItemID == itemID && !tab.Slots[i].Placeholder {
			if isStackable(itemID) {
				tab.Slots[i].Quantity += quantity
				b.recalculate()
				return nil
			}
		}
	}
	for i := range tab.Slots {
		if tab.Slots[i].Quantity == 0 && !tab.Slots[i].Placeholder {
			tab.Slots[i] = BankSlotState{ItemID: itemID, Quantity: quantity}
			b.recalculate()
			return nil
		}
	}
	return fmt.Errorf("bank-full")
}
func (b *BankState) Withdraw(itemID string, quantity int64, tabID int) error {
	if quantity <= 0 {
		return fmt.Errorf("invalid-quantity")
	}
	if tabID < 0 || tabID >= BankTabCount {
		return fmt.Errorf("invalid-tab")
	}
	tab := &b.Tabs[tabID]
	for i := range tab.Slots {
		slot := &tab.Slots[i]
		if slot.ItemID == itemID && !slot.Placeholder {
			if slot.Quantity < quantity {
				return fmt.Errorf("insufficient-quantity")
			}
			slot.Quantity -= quantity
			if slot.Quantity == 0 {
				*slot = BankSlotState{}
			}
			b.recalculate()
			return nil
		}
	}
	return fmt.Errorf("item-not-found")
}
func (b *BankState) SelectTab(tab int) error {
	if tab < 0 || tab >= BankTabCount {
		return fmt.Errorf("invalid-tab")
	}
	b.ActiveTab = tab
	b.recalculate()
	return nil
}

func normalizeError(err error) string {
	if err == nil {
		return ""
	}
	return strings.TrimSpace(err.Error())
}
