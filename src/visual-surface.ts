export const QUALITY_PRESETS={
 maximum:{fps:60,pixelRatio:2,samples:4,bloom:true,fxaa:true},
 high:{fps:45,pixelRatio:1.5,samples:2,bloom:true,fxaa:true},
 balanced:{fps:30,pixelRatio:1,samples:1,bloom:false,fxaa:true},
} as const;
export type VisualQuality=keyof typeof QUALITY_PRESETS;
export function isVisualQuality(value:unknown):value is VisualQuality{return typeof value==='string'&&Object.hasOwn(QUALITY_PRESETS,value);}
/** Plugin surface deliberately has no gameplay state, account or inventory API. */
export interface VisualSurface {readonly id:'wayfarer.visual-preferences.v1';getQuality():Promise<VisualQuality|undefined>;setQuality(value:VisualQuality):Promise<void>;clear():Promise<void>;close():Promise<void>;}
export interface VisualSQL {query(sql:string,params?:unknown[]):Promise<{rows:unknown[]}>;close():Promise<void>;}
export class PGliteVisualSurface implements VisualSurface {
 readonly id='wayfarer.visual-preferences.v1' as const;
 private ready:Promise<unknown>;private closed=false;
 constructor(private db:VisualSQL){this.ready=db.query("CREATE TABLE IF NOT EXISTS wayfarer_visual_preferences (singleton BOOLEAN PRIMARY KEY CHECK(singleton), quality TEXT NOT NULL CHECK(quality IN ('maximum','high','balanced')))");}
 private async check(){if(this.closed)throw new Error('Visual surface closed');await this.ready;}
 async getQuality(){await this.check();const result=await this.db.query('SELECT quality FROM wayfarer_visual_preferences WHERE singleton = TRUE');const row=result.rows[0];if(!row)return undefined;const quality=(row as {quality:unknown}).quality;if(!isVisualQuality(quality))throw new Error('Invalid local visual preference');return quality;}
 async setQuality(value:VisualQuality){if(!isVisualQuality(value))throw new Error('Invalid visual quality');await this.check();await this.db.query('INSERT INTO wayfarer_visual_preferences(singleton,quality) VALUES(TRUE,$1) ON CONFLICT(singleton) DO UPDATE SET quality=EXCLUDED.quality',[value]);}
 async clear(){await this.check();await this.db.query('DELETE FROM wayfarer_visual_preferences');}
 async close(){if(!this.closed){this.closed=true;await this.ready.catch(()=>{});await this.db.close();}}
}
