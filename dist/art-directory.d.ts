export declare const ART_DIRECTORY: Readonly<{
    adventurer: Readonly<{
        title: "The Causeway Adventurer";
        url: "/preview/art/causeway-adventurer.jpeg";
        width: 1122;
        height: 1402;
        worldWidth: 1.4;
    }>;
    harvest: Readonly<{
        title: "Harvest Festival";
        url: "/preview/art/harvest-festival.jpeg";
        width: 1448;
        height: 1086;
        worldWidth: 2.2;
    }>;
}>;
export type ArtId = keyof typeof ART_DIRECTORY;
export declare function isArtId(value: unknown): value is ArtId;
