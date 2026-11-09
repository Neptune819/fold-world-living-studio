import {loadStudio,saveStudio,validateStudio} from './studio-data.js';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
export async function setupStudio(onPause){
  const dialog=document.querySelector('#studio'),nav=document.querySelector('#studio-nav'),body=document.querySelector('#studio-content'),status=document.querySelector('#studio-status');
  let data=await loadStudio(),draft=null,active=data.sections[0]?.id,savedFocus=null,editing=false;
  let context={kind:'场景物件',x:innerWidth/2,y:innerHeight/2};
  const heading=document.querySelector('#studio-heading'),origin=document.querySelector('#object-origin');
  const administration=el('details','studio-administration'),adminLabel=el('summary','','资料操作');
  administration.append(adminLabel);
  for(const selector of ['#studio-export','.studio-toolbar .import-button','#studio-print'])administration.append(document.querySelector(selector));
  document.querySelector('.studio-toolbar').append(administration);
  const publish=()=>{document.dispatchEvent(new CustomEvent('studio-data',{detail:data}));};publish();
  const current=()=>draft||data;
  const message=t=>status.textContent=t;
  function mode(value){editing=value;dialog.classList.toggle('editing',value);administration.open=value;document.querySelector('#studio-edit').hidden=value;document.querySelector('#studio-save').hidden=!value;document.querySelector('#studio-cancel').hidden=!value;render();}
  function input(label,value,change,multi=true){const wrap=el('label','edit-field'),name=el('span','',label),field=el(multi?'textarea':'input');field.value=value;field.rows=multi?3:undefined;field.addEventListener('input',()=>change(field.value));wrap.append(name,field);return wrap;}
  function safeURL(value){try{const url=new URL(value);return ['https:','http:','mailto:'].includes(url.protocol)?url.href:null;}catch{return null;}}
  function render(){nav.replaceChildren();body.replaceChildren();const d=current();if(!d.sections.some(s=>s.id===active))active=d.sections[0]?.id;
    for(const sec of d.sections){const b=el('button',sec.id===active?'selected':'',sec.title||'未命名栏目');b.setAttribute('aria-current',String(sec.id===active));b.onclick=()=>{active=sec.id;render();};nav.append(b);}
    if(editing){const b=el('button','add-section','＋ 添加场景物件');b.onclick=()=>{const id=crypto.randomUUID();draft.sections.push({id,title:'新栏目',intro:'',items:[]});active=id;render();};nav.append(b);}
    const sec=d.sections.find(s=>s.id===active);heading.textContent=sec?.title||'场景内容';origin.textContent=context.kind+' · '+(editing?'编辑物件内容':'');nav.hidden=!editing;if(!sec){body.append(el('p','empty','点击“编辑内容”添加场景物件。'));return;}
    if(editing){body.append(input('栏目名称',sec.title,v=>sec.title=v,false),input('栏目简介',sec.intro,v=>sec.intro=v));const actions=el('div','row-actions');const move=delta=>{const i=draft.sections.indexOf(sec),to=i+delta;if(to>=0&&to<draft.sections.length){draft.sections.splice(i,1);draft.sections.splice(to,0,sec);render();}};for(const [label,fn] of [['栏目上移',()=>move(-1)],['栏目下移',()=>move(1)],['删除栏目',()=>{draft.sections=draft.sections.filter(s=>s!==sec);render();}]]){const b=el('button','',label);b.onclick=fn;actions.append(b);}body.append(actions);
    }else{body.append(el('p','section-intro',sec.intro));if(sec.id==='proposal'){const show=el('button','add-entry','打开 From the Abyss 英文项目汇报');show.onclick=()=>document.dispatchEvent(new CustomEvent('open-project'));body.append(show);}}
    if(sec.id==='about'){const card=el('article','content-card');if(editing){for(const [key,label] of Object.entries({name:'姓名',identity:'身份',school:'学校／专业',introduction:'一句介绍',contact:'联系方式'}))card.append(input(label,d.profile[key],v=>d.profile[key]=v,key==='introduction'));}else{card.append(el('h3','',d.profile.name));for(const key of ['identity','school','introduction','contact'])card.append(el('p','',d.profile[key]));}body.append(card);}
    if(!editing && ['coding','work-log'].includes(sec.id)){
      const frame=el('iframe','published-work');
      frame.src=sec.id==='coding'?'./creative-coding-2/?embedded=1':'./work-log/?embedded=1';
      frame.title=sec.id==='coding'?'Moon Tides — hand-tracking artwork':'From the Abyss — Week 09 working log';
      frame.allow='camera; fullscreen';body.append(frame);
      const full=el('a','published-full','Open full page ↗');full.href=sec.id==='coding'?'./creative-coding-2/':'./work-log/';full.target='_blank';full.rel='noopener';body.append(full);
    }
    for(const [i,item] of sec.items.entries()){const card=el('article','content-card');if(editing){card.append(input('条目标题',item.title,v=>item.title=v,false));for(const [label,value] of Object.entries(item.fields)){const wrap=input(label,value,v=>item.fields[label]=v),tools=el('div','field-tools'),name=el('input','field-name'),remove=el('button','','删除字段');name.value=label;name.setAttribute('aria-label','字段名称');name.onchange=()=>{const next=name.value.trim();if(!next||next===label)return;if(next in item.fields){message('同一条目内的字段名不能重复。');name.value=label;return;}item.fields=Object.fromEntries(Object.entries(item.fields).map(([k,v])=>[k===label?next:k,v]));render();};remove.type='button';remove.onclick=()=>{delete item.fields[label];render();};tools.append(name,remove);wrap.prepend(tools);card.append(wrap);}
        const addField=el('button','','＋ 自定义字段');addField.onclick=()=>{let name='新字段';let j=2;while(name in item.fields)name='新字段 '+j++;item.fields[name]='';render();};card.append(addField);
        const label=el('label','import-button','添加／替换图片（PNG、JPEG、WebP，2 MB以内）'),file=el('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.onchange=()=>{const f=file.files[0];if(!f)return;if(f.size>2000000||!['image/png','image/jpeg','image/webp'].includes(f.type)){message('请选择2 MB以内的PNG、JPEG或WebP图片。');return;}const reader=new FileReader();reader.onload=()=>{item.image=reader.result;render();};reader.readAsDataURL(f);};label.append(file);card.append(label);
        if(item.image){const image=el('img','entry-image');image.src=item.image;image.alt=item.title;card.append(image);const remove=el('button','','移除图片');remove.onclick=()=>{item.image='';render();};card.append(remove);}
        const controls=el('div','row-actions');for(const [label,fn] of [['上移',()=>{if(i>0){sec.items.splice(i,1);sec.items.splice(i-1,0,item);render();}}],['下移',()=>{if(i<sec.items.length-1){sec.items.splice(i,1);sec.items.splice(i+1,0,item);render();}}],['删除条目',()=>{sec.items.splice(i,1);render();}]]){const b=el('button','',label);b.onclick=fn;controls.append(b);}card.append(controls);
      }else{card.append(el('h3','',item.title));if(item.image){const img=el('img','entry-image');img.src=item.image;img.alt=item.title;card.append(img);}for(const [label,value] of Object.entries(item.fields)){if(!value)continue;const field=el('div','view-field');field.append(el('h4','',label));const url=safeURL(value);if(url&&(/URL|链接/i.test(label))){const link=el('a','',/Sketch/.test(label)?'打开可编辑 Sketch ↗':'打开作品／来源 ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';field.append(link,el('small','url-text',value));}else field.append(el('p',value?'':'pending',value||'待填写'));card.append(field);}}
      body.append(card);}
    if(editing){const add=el('button','add-entry','＋ 新增条目');add.onclick=()=>{const fields=sec.items[0]?Object.fromEntries(Object.keys(sec.items[0].fields).map(k=>[k,''])):{'说明':'','来源 URL':''};sec.items.push({id:crypto.randomUUID(),title:'新条目',fields,image:''});render();};body.append(add);}
  }
  function close(){if(editing){message('编辑内容尚未保存。请先保存，或点“取消”放弃本次修改。');return;}body.querySelectorAll('iframe').forEach(frame=>frame.src='about:blank');dialog.close();document.documentElement.style.overflow='';onPause(false);requestAnimationFrame(()=>savedFocus?.focus({preventScroll:true}));}
  function open(id,source={}){if(dialog.open)return;administration.open=false;active=id;context={kind:source.kind||'场景物件',x:source.x??innerWidth/2,y:source.y??innerHeight/2};savedFocus=document.activeElement;dialog.classList.toggle('panel-left',context.x>innerWidth*.55);dialog.dataset.section=id;onPause(true);document.documentElement.style.overflow='hidden';render();message('');dialog.showModal();document.querySelector('#studio-close').focus({preventScroll:true});}
  document.querySelector('#studio-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  document.querySelector('#studio-edit').onclick=()=>{draft=structuredClone(data);mode(true);message('正在编辑；保存后生效，也可以取消。');};
  document.querySelector('#studio-cancel').onclick=()=>{draft=null;mode(false);message('已取消本次修改。');};
  document.querySelector('#studio-save').onclick=async()=>{try{data=await saveStudio(draft);draft=null;publish();mode(false);message('已保存在当前浏览器；此操作不会修改公开网站。');}catch(error){message('保存失败，请先导出备份：'+error.message);}};
  document.querySelector('#studio-export').onclick=()=>{const blob=new Blob([JSON.stringify(current(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='Fold-World-Studio.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);message('已开始导出档案；编辑中的内容也会包含在备份里。');};
  document.querySelector('#studio-import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>12000000)throw new Error('备份超过12 MB。');draft=validateStudio(JSON.parse(await file.text()));active=draft.sections[0]?.id;mode(true);message('已载入备份预览，点“保存修改”后才会替换本机档案。');}catch(error){message('导入失败：'+error.message);}e.target.value='';};
  document.querySelector('#studio-print').onclick=()=>{if(editing){message('请先保存或取消编辑，再打印。');return;}document.body.classList.add('printing-studio');window.print();document.body.classList.remove('printing-studio');};
  render();return{open,close,get opened(){return dialog.open;},get data(){return data;},get editing(){return editing;}};
}
