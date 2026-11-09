// A bundled presentation is a scene exhibit, independent of editable student notes.
export const featuredProject={id:'featured-project',title:'From the Abyss',intro:'',direct:true,items:[{title:'AI 2D Animation · Final Project Proposal'}]};
export const featuredGallery={id:'art-gallery',title:'AI 艺术画廊',intro:'',direct:true,actionLabel:'点击进入画廊',items:[{title:'18 件作品 · 艺术风格实验',image:'./art-gallery/images/thumb-03.webp'}]};

export function setupProjectViewer(onPause){
  const dialog=document.querySelector('#project-viewer'),frame=document.querySelector('#project-frame'),status=document.querySelector('#project-status');
  let home='./project-proposal-en/index.html',pageTitle='From the Abyss',savedFocus=null,savedOverflow='',lastEscape=null;
  const galleryKeys=['work','gallery-q','gallery-collection'];
  const galleryCollections=new Set(['all','narrative','abstract','print','photo','digital']);
  const workNumber=value=>/^(?:0?[1-9]|1[0-8])$/.test(value||'')?String(Number(value)).padStart(2,'0'):null;
  function galleryURL(includeWork=true){
    const params=new URLSearchParams(location.search),url=new URL('./art-gallery/index.html',location.href);
    if(params.get('page')==='gallery'){
      url.searchParams.set('q',params.get('gallery-q')||'');
      const category=params.get('gallery-collection');
      url.searchParams.set('collection',galleryCollections.has(category)?category:'all');
    }
    const work=includeWork&&workNumber(params.get('work'));
    if(work)url.hash='work-'+work;
    return url.href;
  }
  function clearGalleryURL(){
    const url=new URL(location.href);
    if(url.searchParams.get('page')==='gallery')url.searchParams.delete('page');
    galleryKeys.forEach(key=>url.searchParams.delete(key));
    history.replaceState(history.state,'',url.href);
  }
  function syncGalleryURL(){
    if(!dialog.open||dialog.dataset.page!=='gallery')return;
    let child;
    try{child=new URL(frame.contentWindow.location.href);}catch{return;}
    if(child.pathname!==new URL('./art-gallery/index.html',location.href).pathname)return;
    const url=new URL(location.href),work=workNumber(/^#work-(\d{2})$/.exec(child.hash)?.[1]);
    const query=child.searchParams.get('q')||'',category=child.searchParams.get('collection');
    url.searchParams.set('page','gallery');
    work?url.searchParams.set('work',work):url.searchParams.delete('work');
    query?url.searchParams.set('gallery-q',query):url.searchParams.delete('gallery-q');
    category&&category!=='all'&&galleryCollections.has(category)?url.searchParams.set('gallery-collection',category):url.searchParams.delete('gallery-collection');
    history.replaceState(history.state,'',url.href);
  }
  function close(syncURL=true){
    if(!dialog.open)return;
    if(syncURL&&dialog.dataset.page==='gallery')clearGalleryURL();
    dialog.close();document.documentElement.style.overflow=savedOverflow;onPause(false);
    frame.src='about:blank';requestAnimationFrame(()=>savedFocus?.isConnected&&savedFocus.focus({preventScroll:true}));
  }
  function open(id=featuredProject.id){
    if(dialog.open)return;
    const isGallery=id===featuredGallery.id;
    home=isGallery?galleryURL():'./project-proposal-en/index.html';
    if(isGallery&&new URLSearchParams(location.search).get('page')!=='gallery'){
      const url=new URL(location.href);url.searchParams.set('page','gallery');
      history.pushState(history.state,'',url.href);
    }
    pageTitle=isGallery?'AI 艺术画廊':'From the Abyss';
    dialog.dataset.page=isGallery?'gallery':'project';dialog.setAttribute('aria-label',pageTitle);
    frame.title=isGallery?'AI 艺术实验画廊 · 18 件作品':'From the Abyss — 英文项目汇报';
    const homeButton=document.querySelector('#project-home');homeButton.textContent=pageTitle;homeButton.title='返回'+pageTitle+'首页';homeButton.setAttribute('aria-label',homeButton.title);
    document.querySelector('.project-bar span').textContent=isGallery?'18 件作品 · AI 生成':'Final Project Proposal';
    savedFocus=document.activeElement;savedOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';onPause(true);status.hidden=false;status.textContent='正在打开'+pageTitle+'…';
    dialog.showModal();frame.src=home;document.querySelector('#project-close').focus({preventScroll:true});
  }
  frame.addEventListener('load',()=>{
    if(!dialog.open||frame.contentWindow.location.href==='about:blank')return;
    const doc=frame.contentDocument;
    if(!doc?.body||doc.body.textContent.trim()==='Not found'){status.hidden=false;status.textContent=pageTitle+'文件未找到，请返回场景后重新打开。';return;}
    status.hidden=true;
    syncGalleryURL();
    // Escape inside the same-origin iframe otherwise never reaches the scene.
    // Let the report's own notes/story dialogs consume Escape first.
    if(lastEscape)frame.contentWindow.removeEventListener('keydown',lastEscape);
    lastEscape=e=>{if(!e.defaultPrevented&&e.key==='Escape'&&!doc.querySelector('dialog[open]')){e.preventDefault();close();}};
    frame.contentWindow.addEventListener('keydown',lastEscape);
  });
  document.querySelector('#project-close').onclick=()=>close();
  document.querySelector('#project-home').onclick=()=>{status.hidden=false;status.textContent='正在返回'+pageTitle+'首页…';frame.src=dialog.dataset.page==='gallery'?galleryURL(false):home;};
  document.addEventListener('close-featured-page',()=>close());
  document.addEventListener('gallery-location-change',syncGalleryURL);
  addEventListener('popstate',()=>requestAnimationFrame(()=>{
    if(new URLSearchParams(location.search).get('page')!=='gallery'){
      if(dialog.open&&dialog.dataset.page==='gallery')close(false);
      return;
    }
    if(!dialog.open){if(!document.querySelector('#studio')?.open)open(featuredGallery.id);return;}
    if(dialog.dataset.page!=='gallery')return;
    const expected=new URL(galleryURL()),actual=new URL(frame.contentWindow.location.href);
    const same=actual.pathname===expected.pathname&&actual.hash===expected.hash&&(actual.searchParams.get('q')||'')===(expected.searchParams.get('q')||'')&&(actual.searchParams.get('collection')||'all')===(expected.searchParams.get('collection')||'all');
    if(!same)frame.contentWindow.location.replace(expected.href);
  }));
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  return{open,close,get opened(){return dialog.open;}};
}
