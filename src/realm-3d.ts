import {isPracticeSkill} from './practice.js';
import {createWallPainting} from './wall-painting-3d.js';
import {createNamedNPC3D} from './npc-cast-3d.js';
import {placeRealmCast,type NPCPlacement} from './npc-prototypes.js';
import {RealmSky3D} from './realm-sky-3d.js';
import {WeatherChunkCache,type RealmWeather} from './realm-weather.js';
import {decorateRealmNPC} from './npc-details.js';
import {AbstractEngine,Engine,Scene,ArcRotateCamera,Vector3,HemisphericLight,DirectionalLight,PointLight,Color3,Color4,MeshBuilder,StandardMaterial,DefaultRenderingPipeline,LinesMesh,ShadowGenerator,Matrix} from '@babylonjs/core';
import {QUALITY_PRESETS,isVisualQuality,type VisualQuality} from './visual-surface.js';
import {cameraDirection} from './travel-controls.js';
import {createHero3D} from './hero-3d.js';
import {RealmAmbience3D} from './realm-ambience-3d.js';
import {createRetroGrass,styleRetroMesh} from './retro-world.js';
import {practiceGesture} from './practice-pose.js';
import {createPracticeYard} from './practice-yard-3d.js';
import {Wildlife3D} from './wildlife-3d.js';
import {wildlifeForRealm} from './wildlife.js';
import {createRealmScene,REALM_WORLD} from './realm-scene.js';
import {crossingScene} from './scene-meshes.js';
import {mountBabylonMesh} from './babylon-mesh.js';
import type {Point} from './world.js';import type {GameState,Skin} from './game-actions.js';
/** Alternate renderer consumes only validated/interpolated server state. */
export class Realm3D {
 private engine:AbstractEngine;private scene:Scene;private camera:ArcRotateCamera;private heroes=new Map<string,{skin:Skin;hero:ReturnType<typeof createHero3D>}>();private lastPaint=-Infinity;private disposed=false;
 private warden:ReturnType<typeof createHero3D>;private halden:ReturnType<typeof createHero3D>;private ring:ReturnType<typeof MeshBuilder.CreateTorus>;
 private harvestPainting:ReturnType<typeof createWallPainting>|undefined;
 private painting:ReturnType<typeof createWallPainting>|undefined;
 readonly castPlacements:NPCPlacement[];private cast:{placement:NPCPlacement;hero:ReturnType<typeof createNamedNPC3D>}[]=[];
 private sky:RealmSky3D;private weather:RealmWeather|undefined;private weatherChunks=new WeatherChunkCache(REALM_WORLD.seed);private wetMaterials:{material:StandardMaterial;base:Color3;cx:number;cz:number}[]=[];private moistureAt=-Infinity;private npcDetails:ReturnType<typeof decorateRealmNPC>[]=[];
 get weatherState(){return this.weather?{...this.weather}:undefined;}
 private viewport='';
 private ambientLight:HemisphericLight|undefined;private keyLight:DirectionalLight|undefined;private shadows:ShadowGenerator|undefined;private waterMaterials:StandardMaterial[]=[];
 private pipeline:DefaultRenderingPipeline|undefined;private quality:VisualQuality='maximum';private contextLost=false;
 private ambience:RealmAmbience3D;private retro=true;private flashes=true;private ambientText:string|undefined;
 private grass:ReturnType<typeof createRetroGrass>;private metricsAt=-Infinity;private cachedMetrics={meshes:0,triangles:0,grassTufts:0,fps:0};
 get worldMetrics(){return {...this.cachedMetrics};}
 private wildlife:Wildlife3D;private practiceYard:ReturnType<typeof createPracticeYard>;
 private xamId:string|undefined;private xamSkill:string|undefined;
 setXam(id:string|undefined,skill:string|undefined){this.xamId=id;this.xamSkill=skill;}
 projectLabel(position:Point){const width=this.canvas?.clientWidth??this.engine.getRenderWidth(),height=this.canvas?.clientHeight??this.engine.getRenderHeight(),v=Vector3.Project(new Vector3(position.x,position.y+2.35,position.z),Matrix.Identity(),this.scene.getTransformMatrix(),this.camera.viewport.toGlobal(width,height));return {x:v.x,y:v.y,visible:v.z>=0&&v.z<=1&&v.x>=0&&v.x<=width&&v.y>=0&&v.y<=height};}
 private follow:Vector3|undefined;private followId:string|undefined;private followTime:number|undefined;
 movementDirection(right:number,forward:number){return cameraDirection(right,forward,this.camera.alpha);}
 zoomCamera(factor:number){if(!Number.isFinite(factor)||factor<=0)throw new Error('Invalid zoom');this.camera.radius=Math.max(6,Math.min(75,this.camera.radius*factor));this.camera.inertialRadiusOffset=0;}
 resetCamera(){this.camera.alpha=-Math.PI/2;this.camera.beta=Math.PI/3;this.camera.radius=23;this.camera.inertialAlphaOffset=0;this.camera.inertialBetaOffset=0;this.camera.inertialRadiusOffset=0;this.camera.inertialPanningX=0;this.camera.inertialPanningY=0;if(this.follow)this.camera.setTarget(this.follow.clone(),false,true,true);}

 get wildlifeCount(){return this.wildlife.count;}
 get ambienceText(){return this.ambientText;}
 setFlashes(enabled:boolean){this.flashes=enabled;}
 setRetro(enabled:boolean){this.retro=enabled;this.scene.fogColor=enabled?new Color3(.09,.17,.25):new Color3(.055,.085,.17);if(this.pipeline)this.pipeline.bloomEnabled=!enabled&&QUALITY_PRESETS[this.quality].bloom;}
 get renderState(){return this.contextLost?'recovering':'ready';}
 setQuality(quality:VisualQuality){
  if(!isVisualQuality(quality))throw new Error('Invalid visual quality');this.quality=quality;this.viewport='';
  const preset=QUALITY_PRESETS[quality];if(this.pipeline){this.pipeline.samples=Math.min(preset.samples,this.engine.getCaps().maxMSAASamples||1);this.pipeline.fxaaEnabled=preset.fxaa;this.pipeline.bloomEnabled=preset.bloom;this.pipeline.bloomThreshold=.8;this.pipeline.bloomWeight=.2;}
  if(this.keyLight)this.keyLight.shadowEnabled=quality!=='balanced';this.setRetro(this.retro);
 }
 static create(canvas:HTMLCanvasElement){const engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true});try{return new Realm3D(canvas,engine);}catch(error){engine.dispose();throw error;}}
 retryArtwork(){this.painting?.retryTexture();this.harvestPainting?.retryTexture();}
 get artworkState(){return [this.painting,this.harvestPainting].filter(p=>!!p).map(p=>({title:p!.title,state:p!.state}));}
 constructor(private canvas:HTMLCanvasElement,engine?:AbstractEngine,attachControls=true){
  this.engine=engine??new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true});this.engine.setHardwareScalingLevel(1);this.scene=new Scene(this.engine);this.scene.clearColor=new Color4(.025,.045,.11,1);this.scene.fogMode=Scene.FOGMODE_EXP2;this.scene.fogDensity=.007;this.scene.fogColor=new Color3(.055,.085,.17);
  this.engine.onContextLostObservable.add(()=>{this.contextLost=true;});this.engine.onContextRestoredObservable.add(()=>{this.contextLost=false;this.viewport='';this.lastPaint=-Infinity;});
  this.camera=new ArcRotateCamera('realm-camera',-Math.PI/2,Math.PI/3,23,new Vector3(38,7,0),this.scene);this.camera.lowerRadiusLimit=6;this.camera.upperRadiusLimit=75;this.camera.lowerBetaLimit=.18;this.camera.upperBetaLimit=1.48;
  this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');this.camera.inertia=.72;this.camera.angularSensibilityX=850;this.camera.angularSensibilityY=850;this.camera.wheelDeltaPercentage=.012;this.camera.pinchDeltaPercentage=.008;this.camera.panningSensibility=120;this.camera.panningDistanceLimit=12;if(attachControls)this.camera.attachControl(canvas,true);
  if(this.engine instanceof Engine){this.pipeline=new DefaultRenderingPipeline('realm-quality',true,this.scene,[this.camera]);this.pipeline.imageProcessingEnabled=true;this.scene.imageProcessingConfiguration.exposure=1.12;this.scene.imageProcessingConfiguration.contrast=1.18;this.setQuality('maximum');}
  const sky=this.ambientLight=new HemisphericLight('moon-ambient',new Vector3(0,1,0),this.scene);sky.diffuse=new Color3(.72,.82,1);sky.groundColor=new Color3(.24,.20,.13);sky.intensity=.95;const moon=this.keyLight=new DirectionalLight('moon',new Vector3(-.3,-1,.3),this.scene);moon.intensity=1.2;moon.diffuse=new Color3(.86,.9,1);if(this.engine instanceof Engine){this.shadows=new ShadowGenerator(1024,moon);this.shadows.usePercentageCloserFiltering=true;this.shadows.setDarkness(.35);moon.shadowMinZ=1;moon.shadowMaxZ=200;}
  const realm=createRealmScene();crossingScene(REALM_WORLD,realm.plan).forEach((data,i)=>{const mounted=mountBabylonMesh(this.scene,'world:'+i,data);styleRetroMesh(mounted.mesh,i===0);mounted.mesh.receiveShadows=true;if(data.color==='#487F87'&&mounted.mesh.material instanceof StandardMaterial){mounted.mesh.material.alpha=.88;mounted.mesh.material.specularPower=64;this.waterMaterials.push(mounted.mesh.material);}if(mounted.mesh.material instanceof StandardMaterial)this.wetMaterials.push({material:mounted.mesh.material,base:mounted.mesh.material.diffuseColor.clone(),cx:Math.floor(mounted.mesh.getBoundingInfo().boundingBox.centerWorld.x/64),cz:Math.floor(mounted.mesh.getBoundingInfo().boundingBox.centerWorld.z/64)});});
  this.sky=new RealmSky3D(this.scene,REALM_WORLD.seed);
  this.grass=createRetroGrass(this.scene,REALM_WORLD.seed,[realm.plan.start,realm.plan.goal],(x,z)=>realm.construction.terrainAt(x,z));
  this.practiceYard=createPracticeYard(this.scene,realm.plan.start,p=>realm.navigation.check(p));
  this.castPlacements=placeRealmCast(realm.plan.start,realm.plan.goal,p=>realm.navigation.check(p));
  const host=this.castPlacements.find(p=>p.id==='tovik');if(host){const z=host.position.z-1.6,x=host.position.x;this.painting=createWallPainting(this.scene,{x,y:realm.construction.terrainAt(x,z).height,z},this.engine instanceof Engine);}
  const apothecary=this.castPlacements.find(p=>p.id==='mirella');if(apothecary){const x=apothecary.position.x,z=apothecary.position.z+1.6;this.harvestPainting=createWallPainting(this.scene,{x,y:realm.construction.terrainAt(x,z).height,z},this.engine instanceof Engine,'harvest');this.harvestPainting.root.rotation.y=Math.PI;}
  const pin=this.castPlacements.find(p=>p.id==='pin')?.position,branik=this.castPlacements.find(p=>p.id==='branik')?.position;
  for(const placement of this.castPlacements)if(!['halden','pin','branik'].includes(placement.id))this.cast.push({placement,hero:createNamedNPC3D(this.scene,'cast:'+placement.id,placement.id)});
  this.ambience=new RealmAmbience3D(this.scene,REALM_WORLD.seed,[realm.plan.start,realm.plan.goal],p=>realm.construction.terrainAt(p.x,p.z).height,pin&&branik?{pin,branik}:undefined);
  const wildlifeGround=(x:number,z:number)=>realm.construction.terrainAt(x,z);this.wildlife=new Wildlife3D(this.scene,wildlifeGround);this.wildlife.sync(wildlifeForRealm(REALM_WORLD,[realm.plan.start,realm.plan.goal],wildlifeGround));
  const glow=new StandardMaterial('lantern-glow',this.scene);glow.emissiveColor=new Color3(1,.55,.13);glow.diffuseColor=new Color3(1,.72,.25);
  for(const p of [realm.plan.start,realm.plan.goal]){const point=realm.navigation.check(p);if(!point.ok)continue;for(const side of [-1,1]){const lamp=MeshBuilder.CreateSphere('landing-lantern',{diameter:.5,segments:6},this.scene);lamp.position.set(point.position.x,point.position.y+2.1,side*2);lamp.material=glow;const light=new PointLight('lantern',lamp.position,this.scene);light.diffuse=new Color3(1,.56,.2);light.intensity=1.8;light.range=12;}}
  this.halden=createNamedNPC3D(this.scene,'halden','halden');this.warden=createHero3D(this.scene,'warden','elder');this.warden.root.scaling.setAll(1.4);this.npcDetails=[decorateRealmNPC(this.scene,'warden',this.warden.root,'warden')];this.ring=MeshBuilder.CreateTorus('pulse-ring',{diameter:8,thickness:.06,tessellation:48},this.scene);const m=new StandardMaterial('pulse',this.scene);m.emissiveColor=new Color3(.4,.8,.75);this.ring.material=m;
 }
 update(players:readonly {id:string;position:Point}[],game:GameState|undefined,local:string|undefined,now:number,paused:boolean,wind=0){
  if(this.disposed||this.contextLost||now-this.lastPaint<1000/QUALITY_PRESETS[this.quality].fps||(typeof document!=='undefined'&&document.hidden))return;this.lastPaint=now;
  const keep=new Set(players.map(p=>p.id));for(const [id,entry] of this.heroes)if(!keep.has(id)){entry.hero.dispose();this.heroes.delete(id);}
  for(const p of players){const appearance=game?.players.find(a=>a.id===p.id),skin=appearance?.skin??'adventurer';let entry=this.heroes.get(p.id);if(!entry||entry.skin!==skin){entry?.hero.dispose();entry={skin,hero:createHero3D(this.scene,p.id,skin)};this.heroes.set(p.id,entry);}entry.hero.weapon(appearance?.weapon??null);entry.hero.update(p.position,now,paused,wind,p.id===local&&game?.practiceChallenge?practiceGesture(game.practiceChallenge.skill):p.id===this.xamId&&isPracticeSkill(this.xamSkill)?practiceGesture(this.xamSkill):'idle');if(p.id===local){
   const target=new Vector3(p.position.x,p.position.y+1.15,p.position.z),dt=this.followTime===undefined?0:Math.max(0,(now-this.followTime)/1000);
   if(!this.follow||this.followId!==local||Vector3.Distance(target,this.follow)>8){this.follow=target;this.camera.setTarget(target.clone(),false,true,true);}
   else {const next=Vector3.Lerp(this.follow,target,paused?1:1-Math.exp(-9*Math.min(dt,.1)));this.camera.setTarget(this.camera.target.add(next.subtract(this.follow)),false,true,true);this.follow=next;}
   this.followId=local;this.followTime=now;this.camera.panningOriginTarget=this.follow.clone();
  }}
  this.halden.root.setEnabled(!!game);if(game){this.halden.update(game.camp,now,paused);this.warden.root.setEnabled(game.encounter.hp>0);this.warden.update(game.beacon.position,now,paused);this.ring.position.set(game.beacon.position.x,game.beacon.position.y+.04,game.beacon.position.z);(this.ring.material as StandardMaterial).emissiveColor=game.encounter.strikeAt?new Color3(1,.35,.12):new Color3(.3,.65,.65);}else{this.warden.root.setEnabled(false);this.ring.setEnabled(false);}
  if(game)this.ring.setEnabled(game.encounter.hp>0);
  const weatherClock=game?game.tick*50:now;this.weather=this.sky.update(weatherClock,this.camera.target,paused,this.quality,this.retro);if(!paused&&Math.abs(weatherClock-this.moistureAt)>=100){this.moistureAt=weatherClock;for(const entry of this.wetMaterials){const w=this.weatherChunks.at(weatherClock,entry.cx,entry.cz).wetness;entry.material.diffuseColor.copyFrom(entry.base.scale(1-w*.16));entry.material.specularColor.set(w*.08,w*.08,w*.08);}}
  const day=this.sky.daylight.day;if(this.ambientLight)this.ambientLight.intensity=.55+day*.4;if(this.keyLight){this.keyLight.intensity=.65+day*.6;this.keyLight.diffuse=Color3.Lerp(new Color3(.65,.76,1),new Color3(1,.91,.73),day);this.keyLight.position.set(this.camera.target.x+30,this.camera.target.y+60,this.camera.target.z-30);}for(const m of this.waterMaterials){m.specularColor.set(.3+day*.25,.4+day*.2,.5+day*.15);m.diffuseColor=Color3.Lerp(new Color3(.15,.32,.42),new Color3(.25,.57,.62),day);}if(this.shadows){const map=this.shadows.getShadowMap();if(map)map.renderList=[...this.heroes.values()].flatMap(e=>e.hero.root.getChildMeshes()).slice(0,96);}
  this.ambientText=this.ambience.update(now,paused,this.flashes&&!paused);
  this.wildlife.update(now,paused);for(const {placement,hero} of this.cast)hero.update(placement.position,now,paused,wind,placement.id==='mirella'?'focus':placement.id==='kestrel'?'wave':'idle');
  const viewport=`${this.canvas?.clientWidth??this.engine.getRenderWidth()}:${this.canvas?.clientHeight??this.engine.getRenderHeight()}:${globalThis.devicePixelRatio||1}`;
  if(viewport!==this.viewport){this.viewport=viewport;const scaling=1/Math.min(Math.max(1,globalThis.devicePixelRatio||1),QUALITY_PRESETS[this.quality].pixelRatio);if(scaling!==this.engine.getHardwareScalingLevel())this.engine.setHardwareScalingLevel(scaling);else this.engine.resize();}
  this.scene.render();if(now-this.metricsAt>=1000){this.metricsAt=now;this.cachedMetrics={meshes:this.scene.meshes.filter(m=>m.isEnabled()).length,triangles:this.scene.meshes.filter(m=>m.isEnabled()).reduce((n,m)=>n+(m instanceof LinesMesh?0:Math.floor(m.getTotalIndices()/3)),0),grassTufts:this.grass.count,fps:this.engine.getFps()};}
 }
 dispose(){if(!this.disposed){this.disposed=true;for(const e of this.heroes.values())e.hero.dispose();for(const detail of this.npcDetails)detail.dispose();for(const actor of this.cast)actor.hero.dispose();this.cast.length=0;this.halden.dispose();this.warden.dispose();this.painting?.dispose();this.harvestPainting?.dispose();this.sky.dispose();this.wetMaterials.length=0;this.weatherChunks.clear();this.ambience.dispose();this.wildlife.dispose();this.grass.dispose();this.practiceYard.dispose();this.shadows?.dispose();this.waterMaterials.length=0;this.pipeline?.dispose();this.scene.dispose();this.engine.dispose();}}
}
