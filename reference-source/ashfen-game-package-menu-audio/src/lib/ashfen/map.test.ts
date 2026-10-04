import assert from "node:assert/strict";
import test from "node:test";
import { MAP_LANDMARKS, MAP_ROUTES, mapBounds, mapRegionAt, overviewMarkers } from "./map.ts";

test("authored map keeps the three readable region bands", () => {
  assert.equal(mapRegionAt(18, 16), "reedhaven");
  assert.equal(mapRegionAt(4, 24), "mire");
  assert.equal(mapRegionAt(34, 13), "outer-wilds");
  assert.equal(mapRegionAt(47, 35), "far-reaches");
});

test("map has authored landmarks and routes for navigation", () => {
  assert.ok(MAP_LANDMARKS.some((landmark) => landmark.id === "tithe-keep" && landmark.kind === "quest"));
  assert.ok(MAP_LANDMARKS.some((landmark) => landmark.id === "southern-mire" && landmark.kind === "danger"));
  assert.equal(MAP_ROUTES.length, 6);
  assert.deepEqual(mapBounds(), { width: 56, height: 44 });
});

test("overview markers preserve self, peer, and landmark positions", () => {
  const markers = overviewMarkers(18, 18, [{ playerId: "p2", displayName: "Wren", x: 6, y: 5, lastServerSeq: 4 }]);
  assert.deepEqual(markers.self, { x: 18.5, y: 18.5, tone: "#f4eee0" });
  assert.equal(markers.peers[0]?.label, "Wren");
  assert.equal(markers.landmarks.length, MAP_LANDMARKS.length);
});
