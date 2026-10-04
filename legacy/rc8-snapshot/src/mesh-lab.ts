import {ABC_PRESETS} from './abc-wind.js';
import {Engine,Scene,ArcRotateCamera,Vector3,HemisphericLight,Color4,MeshBuilder,StandardMaterial,Color3} from '@babylonjs/core';
import {mountBabylonMesh} from './babylon-mesh.js';
import {SoftTools} from './soft-tools.js';
import {mountToolbar} from './multitool.js';
import {createRealmScene,REALM_WORLD} from './realm-scene.js';
import {crossingScene} from './scene-meshes.js';
const canvas=document.querySelector<HTMLCanvasElement>('#mesh')!,status=document.querySelector('#status')!,inspector=document.querySelector('#inspector')!,selector=document.querySelector<HTMLSelectElement>('#point')!;
try{
 const engine=new Engine(canvas,true),scene=new Scene(engine);scene.useRightHandedSystem=true;scene.clearColor=new Color4(.07,.14,.12,1);
 const camera=new ArcRotateCamera('view',-Math.PI/2,Math.PI/3,180,new Vector3(75,0,0),scene);camera.attachControl(canvas,true);camera.lowerRadiusLimit=10;camera.upperRadiusLimit=300;
 new HemisphericLight('sky',new Vector3(0,1,0),scene);
 const realm=createRealmScene(),handles=crossingScene(REALM_WORLD,realm.plan).map((data,i)=>mountBabylonMesh(scene,`world:${i}`,data));
 const tools=new SoftTools(()=>{camera.setTarget(new Vector3(40,8,0));camera.radius=24;},()=>{const m=cloth.mesh.material as StandardMaterial;m.wireframe=!m.wireframe;});
 const patch=tools.patch,cloth=mountBabylonMesh(scene,'cloth',{positions:patch.positions,indices:patch.indices,color:'#bba26a'},true);cloth.mesh.position.x=40;
 const marker=MeshBuilder.CreateSphere('selected-point',{diameter:.35,segments:8},scene),markerMaterial=new StandardMaterial('point-color',scene);markerMaterial.diffuseColor=Color3.FromHexString('#ffe2a1');marker.material=markerMaterial;marker.isPickable=false;
 let line=MeshBuilder.CreateLines('force-vector',{points:[Vector3.Zero(),new Vector3(0,0,1)]},scene);line.color=new Color3(.4,.9,1);line.isPickable=false;
 for(let n=0;n<63;n++){const option=document.createElement('option');option.value=String(n);option.textContent=`Point ${n} · row ${Math.floor(n/7)}${n<7?' · pinned':''}`;selector.append(option);}selector.value=String(tools.selected);
 const abcEnabled=document.querySelector<HTMLInputElement>('#abc-enabled')!,abcPreset=document.querySelector<HTMLSelectElement>('#abc-preset')!;
 const abcInputs=['a','b','c','radius','pulseHz'].map(key=>document.querySelector<HTMLInputElement>(`#abc-${key}`)!);
 // Field markers show the cylinder boundary; they are not colliders.
 const ringPoints=Array.from({length:49},(_,i)=>new Vector3(Math.cos(i/48*Math.PI*2)*6+40,8,Math.sin(i/48*Math.PI*2)*6));
 let ring=MeshBuilder.CreateLines('aura-radius',{points:ringPoints},scene);ring.color=new Color3(.6,.7,1);ring.isPickable=false;
 const top=MeshBuilder.CreateSphere('A-overhead',{diameter:.5,segments:8},scene),bottom=MeshBuilder.CreateSphere('B-below',{diameter:.5,segments:8},scene);
 const topMat=new StandardMaterial('A-color',scene),bottomMat=new StandardMaterial('B-color',scene);topMat.diffuseColor=new Color3(1,.5,.3);bottomMat.diffuseColor=new Color3(.3,.8,1);top.material=topMat;bottom.material=bottomMat;top.isPickable=false;bottom.isPickable=false;top.position.set(40,14,0);bottom.position.set(40,2,0);
 patch.setWind({x:0,y:0,z:0});patch.setABC({...patch.getABC(),enabled:true,...ABC_PRESETS.rising!});
 const sliders=['x','y','z'].map(axis=>document.querySelector<HTMLInputElement>(`#wind-${axis}`)!);
 function syncWind(){const o=patch.getABC();abcEnabled.checked=o.enabled;abcPreset.value=o.enabled?(Object.entries(ABC_PRESETS).find(([,p])=>p.a===o.a&&p.b===o.b&&p.c===o.c)?.[0]??'custom'):'custom';abcInputs.forEach((input,i)=>input.value=String([o.a,o.b,o.c,o.radius,o.pulseHz][i]));const w=patch.getWind();sliders.forEach((slider,i)=>{slider.value=String([w.x,w.y,w.z][i]);});}
 function updateInspector(){
  const i=tools.selected*3,p=new Vector3(patch.positions[i]!+40,patch.positions[i+1]!,patch.positions[i+2]!),w=tools.selectedForce();marker.position.copyFrom(p);
  const abc=patch.getABC();ring.isVisible=top.isVisible=bottom.isVisible=abc.enabled;
  line=MeshBuilder.CreateLines('force-vector',{points:[p,p.add(new Vector3(w.x,w.y,w.z).scale(.5))],instance:line},scene);
  inspector.textContent=`Point ${tools.selected}${tools.selected<7?' (pinned)':''} · X ${p.x.toFixed(2)}, Y ${p.y.toFixed(2)}, Z ${p.z.toFixed(2)} · ABC ${abc.enabled?`A ${abc.a}, B ${abc.b}, C ${abc.c}, radius ${abc.radius}, pulse ${abc.pulseHz} Hz`:'off'} · local wind (${w.x.toFixed(2)}, ${w.y.toFixed(2)}, ${w.z.toFixed(2)}) · ${tools.reducedMotion?'reduced motion':tools.paused?'paused':'running'} · ${tools.lastMessage}`;
 }
 let last:number|undefined;const reduced=matchMedia('(prefers-reduced-motion: reduce)');tools.reducedMotion=reduced.matches;
 const toolbar=mountToolbar(tools.registry,document.querySelector<HTMLElement>('#tools')!,result=>{last=undefined;if(!result.ok)tools.lastMessage=result.reason;syncWind();updateFieldMarkers();cloth.update(patch.positions);updateInspector();});
 sliders.forEach(slider=>slider.addEventListener('input',()=>{try{patch.setWind({x:Number(sliders[0]!.value),y:Number(sliders[1]!.value),z:Number(sliders[2]!.value)});toolbar.refresh();updateInspector();}catch{tools.lastMessage='Invalid force vector';syncWind();}}));syncWind();
 function updateFieldMarkers(){const o=patch.getABC();ring=MeshBuilder.CreateLines('aura-radius',{points:ringPoints.map((_,i)=>new Vector3(Math.cos(i/48*Math.PI*2)*o.radius+40,8,Math.sin(i/48*Math.PI*2)*o.radius)),instance:ring},scene);}
 function changeABC(){try{const o=patch.getABC();patch.setABC({...o,enabled:abcEnabled.checked,a:Number(abcInputs[0]!.value),b:Number(abcInputs[1]!.value),c:Number(abcInputs[2]!.value),radius:Number(abcInputs[3]!.value),pulseHz:Number(abcInputs[4]!.value)});tools.lastMessage='ABC field updated.';syncWind();updateFieldMarkers();toolbar.refresh();updateInspector();}catch{tools.lastMessage='Invalid ABC settings';syncWind();}}
 abcEnabled.addEventListener('change',changeABC);abcInputs.forEach(input=>input.addEventListener('input',changeABC));
 abcPreset.addEventListener('change',()=>{const preset=ABC_PRESETS[abcPreset.value];if(!preset)return;patch.setWind({x:0,y:0,z:0});patch.setABC({...patch.getABC(),enabled:true,...preset});syncWind();updateFieldMarkers();toolbar.refresh();updateInspector();});
 selector.addEventListener('change',()=>{tools.select(Number(selector.value));toolbar.refresh();updateInspector();});
 let down:{x:number;y:number}|undefined;
 const pointerDown=(event:PointerEvent)=>{down={x:event.clientX,y:event.clientY};};
 const pointerUp=(event:PointerEvent)=>{
  if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>5){down=undefined;return;}down=undefined;
  const hit=scene.pick(scene.pointerX,scene.pointerY,mesh=>mesh===cloth.mesh);
  if(!hit?.pickedPoint)return;let best=0,distance=Infinity;
  for(let n=0;n<63;n++){const d=Vector3.DistanceSquared(hit.pickedPoint,new Vector3(patch.positions[n*3]!+40,patch.positions[n*3+1]!,patch.positions[n*3+2]!));if(d<distance){distance=d;best=n;}}
  tools.select(best);selector.value=String(best);toolbar.refresh();updateInspector();
 };
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
 const reduce=()=>{tools.reducedMotion=reduced.matches;last=undefined;toolbar.refresh();};reduced.addEventListener('change',reduce);
 engine.runRenderLoop(()=>{if(document.hidden){last=undefined;return;}const now=performance.now();if(last!==undefined)tools.advance(now-last);last=now;cloth.update(patch.positions);updateInspector();toolbar.refresh();scene.render();});
 const resize=()=>engine.resize();addEventListener('resize',resize);
 addEventListener('pagehide',()=>{removeEventListener('resize',resize);reduced.removeEventListener('change',reduce);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);toolbar.dispose();engine.stopRenderLoop();line.dispose();ring.dispose();top.dispose();bottom.dispose();topMat.dispose();bottomMat.dispose();marker.dispose();markerMaterial.dispose();cloth.dispose();handles.forEach(h=>h.dispose());scene.dispose();engine.dispose();});
 updateInspector();status.textContent='Multitool mesh lab · drag to orbit; tap cloth to inspect · orange A above · blue B below · violet C aura · cyan line shows local wind · local visual cloth, no world collision';
}catch{status.textContent='WebGL initialization failed. The regular walking previews remain available.';}
