import { type Chunk } from './world.js';
export type SurveyCell = 'open' | 'water' | 'steep';
export interface TerrainSurvey {
    cells: SurveyCell[];
    openCells: number;
    waterCells: number;
    steepCells: number;
    components: number;
    largestComponent: number;
    candidate: {
        x: number;
        y: number;
        z: number;
        cell: number;
    } | null;
}
/** Terrain screening only: excludes props, landmarks, construction and actor collision. */
export declare function surveyChunk(chunk: Chunk, maxGrade?: number): TerrainSurvey;
