export const ART_DIRECTORY = Object.freeze({
    adventurer: Object.freeze({ title: 'The Causeway Adventurer', url: '/preview/art/causeway-adventurer.jpeg', width: 1122, height: 1402, worldWidth: 1.4 }),
    harvest: Object.freeze({ title: 'Harvest Festival', url: '/preview/art/harvest-festival.jpeg', width: 1448, height: 1086, worldWidth: 2.2 })
});
export function isArtId(value) { return typeof value === 'string' && Object.hasOwn(ART_DIRECTORY, value); }
