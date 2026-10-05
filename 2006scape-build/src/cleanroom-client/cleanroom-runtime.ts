/**
 * Project Copper Lantern — single clean-room client runtime composition.
 *
 * The runtime owns one authority port and one scene controller. Every renderer,
 * HUD panel, resource node, NPC definition, and bank command is reached through
 * this boundary. No UI callback writes directly to gameplay state.
 */

import type { BankPanelCommand } from "./bank-ui";
import { mountBankPanel, type BankPanelCommandSink, type BankPanelDomBinding } from "./bank-ui-dom";
import type { BankTabId } from "./bank-system";
import {
  LocalGardenDemoAuthority,
  WelcomeGardenSceneController,
  type GardenAuthorityPort,
  type GardenInput,
  type GardenRenderModel,
  type GardenSceneState,
} from "./welcome-garden/welcome-garden-slice";

export type CleanroomRuntimePhase = "created" | "booting" | "ready" | "failed";

export type CleanroomRuntimeManifest = Readonly<{
  protocol: "copper-lantern-local-authority-v1";
  worldSpace: "sable-fen";
  levelId: "welcome-garden-ground";
  source: "local-demo";
  systems: readonly ["authority", "movement", "appearance", "resources", "npcs", "bank", "hud", "world-detail", "vertical-expansion"];
  resourceNodeCount: number;
  npcCount: number;
  realmObjectCount: number;
  bankTabCount: number;
}>;

export type CleanroomRuntimeState = Readonly<{
  phase: CleanroomRuntimePhase;
  scene: GardenSceneState;
  manifest: CleanroomRuntimeManifest;
  lastRuntimeError?: string;
}>;

export type BankCommandResult = Readonly<{
  accepted: boolean;
  state: CleanroomRuntimeState;
  reason?: string;
}>;

function isBankTab(value: number): value is BankTabId {
  return Number.isInteger(value) && value >= 0 && value <= 8;
}

export class CleanroomClientRuntime {
  private readonly authority: LocalGardenDemoAuthority;
  private readonly controller: WelcomeGardenSceneController;
  private state: CleanroomRuntimeState;
  private bankBinding?: BankPanelDomBinding;

  public constructor(playerId = "local-demo-player", authority?: GardenAuthorityPort) {
    this.authority = authority instanceof LocalGardenDemoAuthority ? authority : new LocalGardenDemoAuthority(playerId);
    const sceneAuthority = authority ?? this.authority;
    this.controller = new WelcomeGardenSceneController(sceneAuthority, playerId);
    this.state = {
      phase: "created",
      scene: this.controller.getState(),
      manifest: {
        protocol: "copper-lantern-local-authority-v1",
        worldSpace: "sable-fen",
        levelId: "welcome-garden-ground",
        source: "local-demo",
        systems: ["authority", "movement", "appearance", "resources", "npcs", "bank", "hud", "world-detail", "vertical-expansion"],
        resourceNodeCount: 0,
        npcCount: 0,
        realmObjectCount: 0,
        bankTabCount: 9,
      },
    };
  }

  public getState(): CleanroomRuntimeState { return this.state; }

  public async boot(): Promise<CleanroomRuntimeState> {
    this.state = { ...this.state, phase: "booting", lastRuntimeError: undefined };
    try {
      const scene = await this.controller.boot();
      const model = this.controller.render(0, 0);
      this.state = {
        phase: scene.phase === "ready" ? "ready" : "failed",
        scene,
        manifest: {
          ...this.state.manifest,
          resourceNodeCount: model.resources.length,
          npcCount: model.npcs.length,
          realmObjectCount: model.realmObjects.length,
          bankTabCount: scene.snapshot?.bank.tabs.length ?? this.state.manifest.bankTabCount,
        },
        lastRuntimeError: scene.phase === "ready" ? undefined : "The authoritative scene did not reach ready state.",
      };
    } catch (cause) {
      this.state = { ...this.state, phase: "failed", lastRuntimeError: cause instanceof Error ? cause.message : "Runtime boot failed." };
    }
    return this.state;
  }

  public async dispatch(input: GardenInput): Promise<CleanroomRuntimeState> {
    if (this.state.phase !== "ready") return { ...this.state, lastRuntimeError: "Runtime is not ready; boot the authoritative scene first." };
    try {
      const scene = await this.controller.handle(input);
      this.state = { ...this.state, scene, lastRuntimeError: undefined };
      this.refreshBankBinding();
    } catch (cause) {
      this.state = { ...this.state, lastRuntimeError: cause instanceof Error ? cause.message : "Input dispatch failed." };
    }
    return this.state;
  }

  public render(timeSeconds: number, deltaSeconds: number): GardenRenderModel {
    if (this.state.phase !== "ready") throw new Error("Cannot render before the clean-room runtime is ready.");
    return this.controller.render(timeSeconds, deltaSeconds);
  }

  public async dispatchBankCommand(command: BankPanelCommand): Promise<BankCommandResult> {
    if (command.type === "bank.tab.select") {
      if (!isBankTab(command.tab)) return { accepted: false, state: this.state, reason: "Invalid bank tab." };
      const state = await this.dispatch({ type: "bank.tab.select", tab: command.tab });
      return { accepted: state.scene.action.phase === "accepted", state, reason: state.scene.lastError?.message };
    }
    if (command.type === "bank.deposit") {
      const state = await this.dispatch({ type: "bank.deposit", itemId: command.itemId, quantity: command.quantity, tab: command.tab });
      return { accepted: state.scene.action.phase === "accepted", state, reason: state.scene.lastError?.message };
    }
    if (command.type === "bank.withdraw") {
      const state = await this.dispatch({ type: "bank.withdraw", itemId: command.itemId, quantity: command.quantity, tab: command.tab });
      return { accepted: state.scene.action.phase === "accepted", state, reason: state.scene.lastError?.message };
    }
    return { accepted: false, state: this.state, reason: `Bank command ${command.type} is presentation-only or not yet authoritative.` };
  }

  public mountBankPanel(host: HTMLElement): BankPanelDomBinding {
    if (this.state.phase !== "ready" || !this.state.scene.snapshot) throw new Error("Cannot mount the bank panel before runtime boot.");
    const sink: BankPanelCommandSink = (command) => {
      void this.dispatchBankCommand(command).then(() => this.refreshBankBinding());
    };
    this.bankBinding?.destroy();
    this.bankBinding = mountBankPanel(host, this.state.scene.snapshot.bank, sink);
    return this.bankBinding;
  }

  public dispose(): void {
    this.bankBinding?.destroy();
    this.bankBinding = undefined;
  }

  private refreshBankBinding(): void {
    if (this.bankBinding && this.state.scene.snapshot) this.bankBinding.update(this.state.scene.snapshot.bank);
  }
}
