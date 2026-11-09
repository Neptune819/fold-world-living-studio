// CSS-pixel paths, with an exact live endpoint. The layered stroke is visible
// on both bright and dark environments without replacing the system cursor.
export function drawSilk(ctx,trail,now){
  if(!trail.length)return;
  const head=trail.at(-1),fade=Math.pow(Math.max(0,1-(now-head.t)/560),1.5);
  let distance=0,start=trail.length-1;
  for(let i=trail.length-2;i>=0;i--){distance+=Math.hypot(trail[i+1].x-trail[i].x,trail[i+1].y-trail[i].y);if(distance>155)break;start=i;}
  const pts=trail.slice(start);
  if(pts.length>1){
    function path(strand){ctx.beginPath();const offset=pts.map((p,i)=>{const f=i/(pts.length-1),a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,n=Math.sin(f*Math.PI)*(strand-1)*3.2;return{x:p.x-dy/len*n,y:p.y+dx/len*n};});ctx.moveTo(offset[0].x,offset[0].y);for(let i=1;i<offset.length-1;i++)ctx.quadraticCurveTo(offset[i].x,offset[i].y,(offset[i].x+offset[i+1].x)/2,(offset[i].y+offset[i+1].y)/2);ctx.lineTo(head.x,head.y);}
    const gradient=ctx.createLinearGradient(pts[0].x,pts[0].y,head.x+.01,head.y+.01);
    gradient.addColorStop(0,'rgba(151,102,35,0)');gradient.addColorStop(.35,`rgba(176,115,37,${fade*.6})`);gradient.addColorStop(1,`rgba(255,225,157,${fade*.95})`);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';path(1);ctx.lineWidth=4.6;ctx.strokeStyle=`rgba(61,41,14,${fade*.35})`;ctx.stroke();
    ctx.shadowColor=`rgba(255,193,84,${fade*.9})`;ctx.shadowBlur=8;ctx.strokeStyle=gradient;ctx.lineWidth=2.7;path(1);ctx.stroke();ctx.shadowBlur=0;
    for(const strand of [0,2]){ctx.lineWidth=.85;path(strand);ctx.stroke();}ctx.restore();
  }
  ctx.fillStyle=`rgba(255,235,183,${fade*.85})`;ctx.beginPath();ctx.arc(head.x,head.y,1.8,0,Math.PI*2);ctx.fill();
}
