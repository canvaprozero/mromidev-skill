import * as T from 'three';
import {Pen, blobPts, headBlob, INK} from '../bridge/toon';

export type Vec = [number, number, number];
const v = (point:Vec) => new T.Vector3(...point);

function put(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,point:Vec) {
  const mesh=new T.Mesh(geometry,material);
  mesh.position.set(...point);
  parent.add(mesh);
  return mesh;
}

const axis = new T.Vector3(0, 1, 0);
function headImage(worker: boolean, skin: string, hair: string, mask: boolean, gaze=1, blink=false, glasses=false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const g = canvas.getContext('2d')!;
  const pen = new Pen(g);
  const shape = blobPts(194, 205, {...headBlob(13, 128, 1), b:113});
  pen.poly(shape, skin, 12);
  pen.clip(shape, () => {
    const shade = g.createLinearGradient(90,145,290,300);
    shade.addColorStop(0,'#fff9de00');
    shade.addColorStop(1,'#67475246');
    g.fillStyle=shade;
    g.fillRect(60,65,290,270);
    pen.poly([[65,170],[83,116],[135,88],[271,87],[320,121],[325,166],[285,157],[242,157],[217,140],[187,171],[162,174],[145,156],[112,183],[71,198]],hair,7);
  });
  pen.ell(80,218,20,25,skin,7,0,360);
  if(blink){
    pen.line([[145,205],[169,212],[190,204]],INK,8,false);
    pen.line([[221,204],[244,211],[266,204]],INK,8,false);
  }else{
    pen.ell(169,203,25,30,'#fff7e7',6,0,360);
    pen.ell(244,202,25,30,'#fff7e7',6,0,360);
    pen.ell(169+gaze*10,209,9,16,INK,0);
    pen.ell(244+gaze*10,208,9,16,INK,0);
  }
  pen.line([[145,175],[180,167],[191,173]],INK,7,false);
  pen.line([[224,172],[252,165],[264,170]],INK,7,false);
  pen.line([[216,209],[226,230],[213,234]],'#855253',5,false);
  pen.line([[184,265],[203,269],[228,259]],INK,6,false);
  if(glasses){
    const metal='#503c38';
    pen.ell(165,204,36,37,null,8,0,360);
    pen.ell(247,203,35,37,null,8,0,360);
    pen.line([[199,198],[211,194],[222,198]],metal,8,false);
    pen.line([[130,192],[104,187]],metal,7,false);
  }
  if(worker){
    pen.poly([[61,157],[78,103],[109,72],[151,57],[223,57],[267,74],[291,100],[312,158]],'#e4a347',10);
    pen.poly([[78,146],[117,131],[232,134],[303,148],[333,155],[337,173],[247,181],[153,167],[68,173],[55,164]],'#ffc75b',9);
    pen.line([[147,73],[135,107],[135,131]],'#ac6e3a',8,false);
  }
  if(mask) {
    pen.poly([[101,150],[284,146],[306,182],[301,283],[242,319],[114,303],[94,270]],'#313e49',11);
    pen.poly([[138,181],[271,177],[271,224],[138,228]],'#172631',7);
    pen.line([[153,200],[233,193]],'#65988f',7,false);
    pen.line([[124,270],[170,279]],'#637880',7,false);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map:texture,alphaTest:.42,toneMapped:false});
}

type Look = {worker:boolean, skin:string, shirt:string, hair:string, helmet?:boolean, gaze?:number, glasses?:boolean};
type Pose = {
  body:Vec;
  feet:[Vec,Vec];
  hands:[Vec,Vec];
  turn:number;
  lean:number;
  tilt?:number;
  visor?:boolean;
  blink?:boolean;
};

function paintedCard(width:number,height:number,paint:(pen:Pen)=>void) {
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  paint(new Pen(canvas.getContext('2d')!));
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map,alphaTest:.42,toneMapped:false});
}

function torsoImage(look:Look) {
  return paintedCard(320,416,pen=>{
    const contour=blobPts(160,215,{
      a:131,b:186,nTop:2.56,nBot:2.85,
      egg:.102,asym:.012,rot:0,noise:.006,seed:look.worker?41:55
    });
    pen.poly(contour,look.shirt,13);
    pen.clip(contour,()=>{
      pen.poly([[29,290],[81,331],[183,353],[278,320],[302,397],[23,406]],look.worker?'#31414d':'#746673',0);
    });
    if(look.worker) {
      pen.poly([[60,78],[90,62],[113,286],[91,294]],'#d9cba3',5);
      pen.poly([[224,63],[251,82],[229,295],[206,284]],'#d9cba3',5);
      pen.poly([[68,259],[248,259],[246,347],[76,348]],'#435363',6);
      pen.poly([[115,274],[200,274],[199,312],[117,312]],'#607285',5);
      pen.line([[130,286],[187,286]],'#8395a0',5,false);
      pen.poly([[122,37],[160,61],[201,37],[188,80],[133,80]],'#455460',5);
    } else {
      pen.poly([[132,80],[151,89],[161,133],[177,90],[198,77],[203,213],[155,263],[115,207]],'#f6e5c4',7);
      pen.poly([[153,112],[172,113],[177,231],[162,257],[145,230]],'#a95743',6);
      pen.poly([[121,56],[66,109],[95,171],[79,192],[155,260],[127,157]],'#b0a091',6);
      pen.poly([[198,56],[254,109],[222,168],[240,190],[158,264],[192,151]],'#b0a091',6);
      pen.line([[213,211],[248,204]],INK,7,false);
      pen.dot(166,292,8,INK);
      pen.dot(165,329,7,INK);
    }
    pen.line([[66,313],[80,332]],'#eee4d155',6,false);
    pen.line([[262,310],[250,332]],'#21223367',7,false);
  });
}

function handImage(look:Look) {
  return paintedCard(128,128,pen=>{
    pen.ell(63,64,43,37,look.worker?'#bb9464':look.skin,11);
    pen.arc(53,56,16,13,-155,-28,6,look.worker?'#f7dba1':'#fff1d0');
  });
}

function bootImage() {
  return paintedCard(192,96,pen=>{
    pen.poly([[12,42],[44,18],[96,17],[108,42],[155,46],[176,61],[175,78],[17,78],[10,67]],'#332b35',8);
    pen.line([[20,69],[167,69]],'#695a59',5,false);
  });
}

const strokeSegments=12;
const stickWidth=.031;

// Each ink stroke has world-space endpoints. The strip faces the lens and keeps
// its depth at every vertex, so furniture and work props still occlude it.
function inkStroke(parent:T.Object3D,material:T.Material) {
  const geometry=new T.BufferGeometry();
  const position=new T.BufferAttribute(new Float32Array((strokeSegments+1)*6),3);
  geometry.setAttribute('position',position);
  const triangles:number[]=[];
  for(let x=0;x<strokeSegments*2;x+=2)triangles.push(x,x+1,x+2,x+1,x+3,x+2);
  geometry.setIndex(triangles);
  const stroke=put(parent,geometry,material,[0,0,0]);
  stroke.frustumCulled=false;
  const curve=new T.QuadraticBezierCurve3(new T.Vector3(),new T.Vector3(),new T.Vector3());
  const point=new T.Vector3(),tangent=new T.Vector3(),view=new T.Vector3(),half=new T.Vector3();
  return (a:T.Vector3, control:T.Vector3, b:T.Vector3, camera:T.PerspectiveCamera, thickness:number)=>{
    curve.v0.copy(a);curve.v1.copy(control);curve.v2.copy(b);
    for(let i=0;i<=strokeSegments;i++){
      const u=i/strokeSegments;
      curve.getPoint(u,point);
      tangent.copy(control).sub(a).multiplyScalar(1-u).addScaledVector(view.copy(b).sub(control),u);
      view.copy(camera.position).sub(point);
      half.crossVectors(tangent,view).normalize().multiplyScalar(thickness/2);
      position.setXYZ(i*2,point.x-half.x,point.y-half.y,point.z-half.z);
      position.setXYZ(i*2+1,point.x+half.x,point.y+half.y,point.z+half.z);
    }
    position.needsUpdate=true;
  };
}

export function actor(parent: T.Scene, look:Look) {
  const root=new T.Group();
  parent.add(root);
  const ink=new T.MeshBasicMaterial({color:INK,side:T.DoubleSide,toneMapped:false});
  const chest=put(root,new T.PlaneGeometry(.55,.666),torsoImage(look),[0,0,0]);
  const head=put(root,new T.PlaneGeometry(.77,.77),headImage(look.worker,look.skin,look.hair,false,look.gaze,false,look.glasses),[0,0,0]);
  const face=head.material;
  const mask=look.helmet?headImage(look.worker,look.skin,look.hair,true):face;
  const closed=headImage(look.worker,look.skin,look.hair,false,look.gaze,true,look.glasses);
  const glove=handImage(look), boot=bootImage();
  const pupils=[face,mask,closed] as T.MeshBasicMaterial[];
  const inkedCards=[chest.material,glove,boot,...pupils] as T.MeshBasicMaterial[];
  const limbs=[-1,1].map(side=>({
    side,
    arm:inkStroke(root,ink),
    leg:inkStroke(root,ink),
    glove:put(root,new T.PlaneGeometry(.072,.072),glove,[0,0,0]),
    boot:put(root,new T.PlaneGeometry(.18,.09),boot,[0,0,0]),
  }));

  function pose(opts:Pose,camera:T.PerspectiveCamera,night:boolean) {
    const center=v(opts.body);
    const toCamera=camera.position.clone().sub(center);
    const cameraYaw=Math.atan2(toCamera.x,toCamera.z);
    const bodyYaw=cameraYaw+Math.sin(opts.turn-cameraYaw)*.19;
    const shoulderRoll=(opts.tilt??0)*.55;
    chest.position.copy(center);
    chest.rotation.set(0,bodyYaw,shoulderRoll,'YXZ');
    const local=(x:number,y:number,z:number)=>new T.Vector3(x,y,z).applyQuaternion(chest.quaternion).add(center);
    head.position.copy(local(.020*Math.sin(opts.turn-cameraYaw),.517,.012));
    head.rotation.set(0,bodyYaw,(opts.tilt??0)*.88,'YXZ');
    head.material=opts.visor?mask:opts.blink?closed:face;
    for(const card of inkedCards)card.color.set(night?'#d4e0f0':'#fff4e5');

    const actorTurn=new T.Quaternion().setFromAxisAngle(axis,opts.turn);
    const footSide=Math.sin(opts.turn-cameraYaw)<-.18?-1:1;
    const across=new T.Vector3(Math.cos(bodyYaw),0,-Math.sin(bodyYaw));
    for(const [index,joint] of limbs.entries()) {
      const shoulder=local(.168*joint.side,.151,-.009);
      const grip=v(opts.hands[index]);
      const bend=shoulder.clone().lerp(grip,.51);
      bend.addScaledVector(across,.11*joint.side);
      bend.y-=.18+opts.lean*.11;
      joint.arm(shoulder,bend,grip,camera,stickWidth);
      joint.glove.position.copy(grip);
      joint.glove.rotation.set(0,Math.atan2(camera.position.x-grip.x,camera.position.z-grip.z),0);

      const hip=local(.103*joint.side,-.246,-.009);
      const foot=v(opts.feet[index]);
      const ankle=foot.clone().add(new T.Vector3(0,.053,0));
      const knee=hip.clone().lerp(ankle,.48).add(new T.Vector3(0,0,.20).applyQuaternion(actorTurn));
      joint.leg(hip,knee,ankle,camera,.034);
      joint.boot.position.copy(foot).addScaledVector(across,.024*footSide);
      joint.boot.position.y+=.042;
      joint.boot.rotation.set(0,bodyYaw,0);
      joint.boot.scale.x=footSide;
    }
  }
  return {root,pose};
}
