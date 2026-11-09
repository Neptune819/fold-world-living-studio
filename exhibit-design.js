import * as T from './vendor/three.module.js';
const bevels=new Map();
export function buildCuratedExhibit(spec,root,{brass,ink,paper}) {
  const group=new T.Group();group.position.set(...spec.position);root.add(group);
  function part(geometry,material,position=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,material);o.position.set(...position);o.scale.set(...scale);o.castShadow=!material.transparent;o.receiveShadow=true;group.add(o);return o;}
  function bevel(position,size,material,r=.04){
    const key=size.join('/')+r;let geo=bevels.get(key);
    if(!geo){const [w,h,d]=size,shape=new T.Shape();shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);geo=new T.ExtrudeGeometry(shape,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*.45,bevelSegments:2,curveSegments:4});geo.translate(0,0,-d/2+r);bevels.set(key,geo);}
    return part(geo,material,position);
  }
  if(spec.book){
    const leafMaterial=[];
    for(const side of [-1,1]){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const c=canvas.getContext('2d');
      c.fillStyle='#d8cdb0';c.fillRect(0,0,512,768);for(let i=0;i<3500;i++){c.fillStyle=i%2?'#6c51340b':'#fff4d910';c.fillRect((i*139)%512,(i*317)%768,2,1);}
      c.strokeStyle='#a18b60';c.lineWidth=2;c.strokeRect(42,39,427,689);
      c.fillStyle='#3b4847';c.textAlign='center';c.font='34px Georgia';c.fillText(side<0?'READING':'RESPONSE',256,107);
      c.font='20px Microsoft YaHei';c.fillText(side<0?'阅读与观察':'回应与思考',256,145);
      if(side<0){for(let y=203;y<608;y+=31){c.fillStyle='#67736980';c.fillRect(82,y,290+(y%3)*16,3);if(y%2)c.fillRect(82,y+10,210,2);}}
      else{c.strokeStyle='#8b744b';for(let i=0;i<4;i++){c.beginPath();c.ellipse(256,350,75+i*17,108-i*14,i*.6,0,Math.PI*2);c.stroke();}for(let y=544;y<652;y+=27){c.fillStyle='#67736980';c.fillRect(87,y,300-(y%3)*17,3);}}
      c.font='15px Georgia';c.fillStyle='#8b744b';c.fillText(side<0?'01 / NOTES':'02 / REFLECTIONS',256,683);
      const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
      const material=new T.MeshStandardMaterial({map,color:0xe5dac4,roughness:.91});leafMaterial.push(material);
      bevel([side*.65,0,-.13],[1.27,1.98,.14],ink,.025);bevel([side*.65,0,-.015],[1.21,1.89,.09],paper,.015);
      const geometry=new T.PlaneGeometry(1.22,1.9,16,20),v=geometry.attributes.position;
      for(let i=0;i<v.count;i++)v.setZ(i,.055+Math.sin((v.getX(i)+.61)/1.22*Math.PI)*.075);geometry.computeVertexNormals();
      const page=part(geometry,material,[side*.65,0,.05]);page.rotation.y=side*.13;
      for(const y of [-.87,.87])bevel([side*1.18,y,-.1],[.14,.10,.045],brass,.01);
    }
    const spine=part(new T.CylinderGeometry(.065,.065,2.05,16),brass);spine.rotation.z=0;
    bevel([.46,-1.18,-.06],[.16,.60,.023],new T.MeshStandardMaterial({color:0x75352d,roughness:.86}),.008);
  }else{
    const width=spec.glass?3.38:2.64,height=spec.glass?2.12:1.92;
    bevel([0,0,0],[width,height,.28],ink,.09);
    for(const side of [-1,1]){bevel([side*(width/2-.07),0,.16],[.04,height-.10,.025],brass,.008);bevel([0,side*(height/2-.07),.16],[width-.1,.04,.025],brass,.008);}
    if(spec.glass){
      for(const y of [-.95,.95])for(let x=-1.5;x<=1.5;x+=.21)bevel([x,y,.18],[.06,.055,.025],brass,.008);
      const projector=bevel([-1.61,-1.20,0],[.82,.50,.65],ink,.04);
      const lens=part(new T.CylinderGeometry(.15,.15,.26,24),brass,[-1.61,-1.2,.43]);lens.rotation.x=Math.PI/2;
      const reels=[];for(const x of [-1.90,-1.35]){const reel=part(new T.TorusGeometry(.23,.021,6,40),brass,[x,-.79,.09]);reels.push(reel);for(let i=0;i<6;i++){const spoke=new T.Mesh(new T.BoxGeometry(.20,.016,.015),brass);spoke.position.set(Math.cos(i*Math.PI/3)*.1,Math.sin(i*Math.PI/3)*.1,0);spoke.rotation.z=i*Math.PI/3;reel.add(spoke);}}
      group.userData.reels=reels;
    }
    if(spec.terminal){
      const keyboard=bevel([0,-1.10,.37],[2.23,.20,.72],ink,.04);keyboard.rotation.x=.25;
      for(let row=0;row<3;row++)for(let key=0;key<10;key++)bevel([-.9+key*.20,-1.02,.11+row*.16],[.12,.035,.11],key%4?brass:paper,.008);
      const depth=spec.position[1]-.13;
      part(new T.CylinderGeometry(.10,.15,depth-1.26,16),brass,[0,-(depth+1.26)/2,-.03]);part(new T.CylinderGeometry(.72,.78,.13,32),ink,[0,-depth,-.03]);
    }
  }
  return group;
}
