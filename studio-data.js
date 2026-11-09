import {profile} from './profile.js';
const entry=(title,fields)=>({id:crypto.randomUUID(),title,fields,image:''});
const section=(id,title,intro,items)=>({id,title,intro,items});
export const initialStudio={schema:1,profile:{...profile},sections:[
  section('about','个人介绍','你的身份、创作方向与联系方式。',[entry('关于我',{'创作方向':'','个人经历':'','作品集链接':''})]),
  section('journey','Visual Journey','记录外部参考及你自己的观察。案例信息、来源与个人短评分开填写。',[
    entry('01 · Network Art / Creative Coding',{'作品':'','作者':'','日期':'','形式':'','权威来源 URL':'','参考内容':'','个人观察与兴趣':''}),
    entry('02 · Moving Image / Animation',{'作品':'','作者':'','日期':'','形式':'','权威来源 URL':'','参考内容':'','个人观察与兴趣':''}),
    entry('03 · Interactive Art & Game Art',{'作品':'','作者':'','日期':'','形式':'','权威来源 URL':'','参与者做什么':'','作品发生什么变化':'','为什么这种互动对我有意思':''})]),
  section('reading','Reading Response','按周保存阅读材料与回应；保留本人写作和 AI 辅助记录的区别。Week 4 总字数不超过500 words，本人写作单独保留。Week 5 不要求书面回应，Week 6 没有阅读作业。',[
    entry('Reading Response',{'周次':'','阅读标题与作者':'','来源 URL':'','HUMAN / 本人写作':'','AI 辅助部分（如适用）':'','自己的修改与判断':''})]),
  section('coding','Creative Coding 2.0 / NetArt 02','展示作品与过程，并保留可编辑的 Sketch 链接。',[
    entry('创意编程作品',{'标题':'','核心想法':'','交互方式':'','观看 URL':'','可编辑 Sketch URL':'','制作过程与个人贡献':'','AI 的具体作用':''})]),
  section('moving-image','3D Art / Moving Image','放置场景、动画或影像作品及制作记录；不同作业可另增条目。',[
    entry('3DArt01',{'项目标题':'','作品说明':'','观看 URL':'','制作工具':'','过程与证据':'','个人贡献与 AI 角色':''}),
    entry('3DArt02 / 动画与影像',{'项目标题':'','故事与空间':'','观看 URL':'','声音与视觉制作':'','过程与证据':'','个人贡献与 AI 角色':''})]),
  section('proposal','Final Project / Idea Presentation','用于 5–6 分钟项目提案，保留课程要求的六部分。',[
    entry('01 · Title + idea',{'项目标题':'','核心思想':''}),
    entry('02 · Inspiration',{'灵感与参考':'','来源 URL':'','参考如何影响项目':''}),
    entry('03 · Creative motivation',{'我感兴趣的话题':'','为什么探索它':''}),
    entry('04 · Artistic plan (Pathway)',{'选择的 Pathway':'','目标受众与预期体验':'','开发与完成计划':''}),
    entry('05 · Tools and production',{'制作工具':'','生产流程':'','时间安排与可行性':''}),
    entry('06 · AI & Questions',{'AI 的具体角色':'','我的创意贡献与决策':'','问题与挑战':'','需要的帮助':''})]),
  section('work-log','Work Log','日期 + 行动 + 证据 + 问题 + 下一步；可以持续增加开发记录。',[
    entry('开发记录',{'日期与版本':'','开发阶段／进度':'','我做了什么':'','证据／文件 URL':'','待办与下一步':'','现有问题':'','可能的解决方案':'','重测结果':'','AI 是否及如何协助':''})])
]};


const publishedEntries = {
  "about": {
    "title": "About this studio",
    "fields": {
      "Practice": "AI-assisted animation, worldbuilding and interactive media.",
      "Current project": "From the Abyss — a 2D animation introducing the background of a game."
    }
  },
  "coding": {
    "title": "Moon Tides — Creative Coding 2.0",
    "fields": {
      "Idea": "An extension of Fold World’s lunar-water atmosphere and pointer-based interaction into a hand-controlled artwork.",
      "Interaction": "Enable the camera, move one hand to guide the orbit, then pinch and release to create a ripple. Mouse and touch controls are also available.",
      "AI role": "A pretrained MediaPipe Hand Landmarker estimates hand landmarks locally in the browser. I designed the visual response and the gesture-to-image mapping with Codex assistance.",
      "Viewing URL": "https://neptune819.github.io/fold-world-living-studio/creative-coding-2/"
    }
  },
  "moving-image": {
    "title": "From the Abyss — existing animation tests",
    "fields": {
      "Status": "Pre-production and selected video tests. The finished film is still in development.",
      "Material": "Storyboards for the first three chapters, 49 reference images and five selected video tests are included in the project proposal.",
      "Viewing URL": "https://neptune819.github.io/fold-world-living-studio/project-proposal-en/"
    }
  },
  "work-log": {
    "title": "Week 09 — 9 November 2026",
    "fields": {
      "Progress": "Project archive review, Living Studio publication and an interactive study.",
      "Completed work": "Prepared the animation materials for online viewing, added the hand-tracking artwork and updated the dated working log with screenshots.",
      "Evidence URL": "https://neptune819.github.io/fold-world-living-studio/work-log/",
      "Next stage": "Build a short rough cut from existing shots, compare continuity, then test narration and music."
    }
  }
};
for(const sec of initialStudio.sections){if(publishedEntries[sec.id])sec.items=[{id:'public-'+sec.id,image:'',...publishedEntries[sec.id]}];}
const key='fold-world-studio-public-20261109';
export function validateStudio(value){
  if(!value||value.schema!==1||!value.profile||!Array.isArray(value.sections)||value.sections.length>40)throw new Error('这不是有效的折界档案备份。');
  const text=(v,max=50000)=>typeof v==='string'?v.slice(0,max):'';
  const result={schema:1,profile:{},sections:[]};for(const field of Object.keys(profile))result.profile[field]=text(value.profile[field],10000);
  const ids=new Set();for(const sec of value.sections){const id=text(sec.id,100);if(!id||ids.has(id)||!Array.isArray(sec.items)||sec.items.length>150)throw new Error('栏目结构无效或内容过多。');ids.add(id);
    result.sections.push({id,title:text(sec.title,200),intro:text(sec.intro,2000),items:sec.items.map(item=>{if(!item||typeof item.fields!=='object'||!item.fields||Array.isArray(item.fields)||Object.keys(item.fields).length>30)throw new Error('条目字段无效。');const fields=Object.create(null);for(const [k,v] of Object.entries(item.fields)){if(['__proto__','constructor','prototype'].includes(k))continue;fields[text(k,200)]=text(v);}const img=text(item.image,3000000);return{id:text(item.id,100)||crypto.randomUUID(),title:text(item.title,300),fields,image:/^data:image\/(png|jpeg|webp);base64,/.test(img)||/^https:\/\//.test(img)?img:''};})});
  }return result;
}
export async function loadStudio(){
  try{const disk=await window.foldStorage?.read();if(disk)return validateStudio(disk);}catch(error){console.warn('档案读取失败',error.message);}
  try{const cached=localStorage.getItem(key);if(cached)return validateStudio(JSON.parse(cached));}catch(error){console.warn('浏览器档案读取失败',error.message);}
  return structuredClone(initialStudio);
}
export async function saveStudio(value){const data=validateStudio(value);if(window.foldStorage){await window.foldStorage.save(data);try{localStorage.setItem(key,JSON.stringify(data));}catch{}return data;}localStorage.setItem(key,JSON.stringify(data));return data;}
