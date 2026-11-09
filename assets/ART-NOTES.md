# 美术迭代 02

角色造型参考：露西原始机械形态，参考公开的 [角色介绍](https://www.taptap.io/post/8134675)。当前为程序化三维再创作，具备卷曲金属发片、狭长面罩、分段装甲、钥匙项链、深色长外套与浅色毛领，不是游戏官方模型，也不代表精确复刻。

`utopia-sky.png` 由内置 image_gen 工具生成，作为远景绘景使用。真实 WebGL 模型包括主箱庭、外围浮岛与天文台、轨道、悬浮碎片、灯具和植被。背景随穿门镜头同步旋转，使用扩展缩放避免旋转时露出边缘。未把平面角色立绘用作三维角色。

## 背景生成提示词

Create a cinematic environment matte painting used as distant background of a real time 3D website. Wide landscape 16:9. Atomic Heart inspired Soviet retrofuturist utopia, sophisticated painterly photorealism. Atmospheric monumental ivory city floating over a sea of clouds, circular brutalist towers and neoclassical colonnades, oxidized bronze domes, scattered muted crimson vertical banners, botanical overgrowth, delicate suspended aerial railways, distant airships. Strong chiaroscuro warm champagne sunlight from upper left, cool desaturated sage shadows, volumetric light shafts through immense soft layered cloud formations. Skyline inhabits outer left and right edges and bottom third, central area is atmospheric open luminous mist, reserve middle foreground for a separate 3D diorama that will be composited in code. City is distant and majestic, not a miniature toy, lush cinematic materials stone age marks and fine carved architectural details. No people no letters no UI no text no watermark. Premium fine art exhibition mood, rich detailed peripheral composition, subtle film grain, restrained sophisticated muted palette not colorful fantasy.

## 旋转修正

箱庭改为明确的竖直轴单向整圈，以 0–7 屏对应 0–360°，界面显示真实角度。原穿门镜头的 45° 倾斜再回正，改成每道门单向完整旋转 360°；两道门累计 720°。不采用四元数最短路径插值，因此不会在超过 180° 时改走回转路径。减少动态模式仍可关闭这些旋转。

## 性能

新增蕨类叶片使用 InstancedMesh 合批。测试电脑在 1366×768 的箱庭四个四分之一圈，以及 1920×1080 的第一道穿门阶段，实测约 60 FPS。精细度仍为风格化实时样片，未制作官方级角色资产和完整 PBR 纹理组。

## 魔法门与交互 v4.2

两道门使用原创程序化几何符文、三层金环与批量粒子。温室新增半拱廊、窗格、穹顶和花台；研究所新增围合大厅、设备墙、观察窗和灯带。这些为代码生成的真实三维构件，没有新外部素材。各世界背景和建筑受同一门洞遮罩限制，穿门后采用相同目的地场景。

鼠标视觉改为短细笔触、低透明度的小惯性环及少量散光，去除粗描边、强光晕和大幅符文爆发；保留原生鼠标。不声称已复刻远端参考网站的具体实现。

## 当前版本 v5.0.1 · 2026-10-12

以上 v4.2 为历史记录。当前中间世界替换为悬空图书馆，门中心改为不透明的流动云雾，不再预览门后世界；鼠标改为三条短暂半透明细丝，去除惯性环。图书馆木纹、地面星图、书架、黄铜栏杆与浮灯由代码生成，云雾使用噪声着色器。没有新增下载素材。重复静态构件进行实例化，门环和浮灯保留独立动画。

## 当前版本 v5.2.0 · 2026-10-12

用户明确撤换图书馆。新目标为用户提供的月夜水面、古代断柱／残拱、破碎石阶和远处金色门的概念图，参考图只保存在本地 concepts/moon-ruins-reference.png，未用作全屏推进背景。

ruin-stone.png 与 ruins-moon.png 由内置 image_gen（非CLI）生成并复制进项目。前者用于石阶和石柱的颜色、凹凸与粗糙度变化（尚非独立物理校准PBR贴图组）；后者为带透明背景的真实感月面远景平面。石阶、柱体和残拱为真实三维，薄云和水面为时间着色器。水面月光／门光反射是程序化视觉近似，不是场景的实时镜面反射。所有素材随程序提供。

石材提示：Production PBR albedo texture for weathered ancient limestone stepping stones in a realistic moonlit fantasy water-ruins 3D website. Square full frame neutral gray blue limestone with fine irregular cracks, eroded mineral grain, dark crevices and chips. Neutral shadowless orthographic macro photograph, tileable edges, no slab outlines, water, vegetation, baked lighting, text or grid.

月面提示：Single perfectly circular full Moon through an astronomical telescope, crisp realistic lunar maria, Tycho crater and ray system, fine impact craters, silver blue gray mineral surface, subtle shading at far right; full disk centered at90% frame, isolated transparent background, no stars, clouds, landscape, halos, text or rings. Moon billboard texture, not a scene.

魔法门为原创GLSL云雾、深度收束和细能量丝，与错层光环、局部光源及批量火花结合。参考奇幻影视中通道深度、材质流动和周围受光的视觉语言，不声称复刻某部电影的镜头或达到电影级模拟。


## v5.4.0 场景精修

新增素材均由本地Canvas或几何代码生成，无外部图片下载。research-atelier.js：石纹铺装、细刻星盘、仪表刻度、拉丝粗糙度、拱窗天文纹；moon-ruins.js：缺角柱体、湿石纹路、断拱、世界空间云雾/水波/前进微光。沿用已记录的 ruin-stone.png 与 ruins-moon.png。新环境装置为界面交互示例，不代表用户已有作品。

## v5.5.0 前景材质与环境层次 · 2026-10-13

新增 `moon-horizon-v55.png` 与 `atelier-depth-v55.png`，由内置 image_gen 生成，保存于本项目 assets 内，分别用作月海与研究所的最远景。它们是绘景，不是三维建筑模型；放在世界坐标中的背景平面上，由镜头投影观看。前方柱廊、残柱、观察厅拱跨、猫道、管线、钟盘、悬浮透镜等为真实三维构件。水面增加绘景的近似反射，仍不是完整场景的实时反射。

首场景新增程序生成的石纹、拉丝粗糙度、织物凹凸与地面细刻纹；24 块倒角环形铺石为真实几何，观察装置底座、外围天文台和柱头接缝为结构补充。人物依旧采用原程序模型，没有引入游戏官方资产。接触阴影采用局部透明贴片，与实际灯光阴影共同使用。新增环境运动遵循减少动态设置。

### 月海远景最终生成提示词

Use case: stylized-concept. Asset type: distant environment matte painting for a high quality realtime 3D moonlit ruin world, landscape 16:9. Create a cinematic dark indigo lunar ocean horizon with ancient monumental fractured stone architecture in the far distance. Composition specifically for a 3D background layer: horizon around 62 percent height, very distant broad ruined colonnades and broken arches on the outer left and right thirds, an immense pale ivory moon high on the left behind layered silver blue clouds, open dark atmosphere in the central third for separately rendered foreground ruins and a portal. No foreground walkway, NO portal, no floating magic ring, no characters, no devices, no text, no UI. Lower third shows quiet blue black ocean, very thin silver moonlight reflections and soft near horizon fog. Realistic weathered limestone with cinematic scale, rich yet restrained atmospheric depth, moonlight arrives from upper left, nuanced darkness, delicate clouds instead of generic noisy fog. Art directed fantasy film environment, elegant mysterious calm. The rendered foreground will be dark blue stone, oxidised bronze devices and a warm gold magic gateway; this background must harmonise without taking their focus.

### 研究所远景最终生成提示词

Use case: stylized-concept. Asset type: distant interior background matte painting for a realtime 3D art installation. Landscape 16:9 cinematic shot inside a monumental retro scientific observatory and optical atelier. Rich dark oxidised emerald enamel, patinated bronze, brushed nickel, deep slate stone, intricate but believable industrial detailing, warm amber instrument lights and cold blue moonlight. View down a very deep long symmetrical vaulted gallery: repeated tall stone arches, elevated brass catwalks, densely articulated pipes along the outer side walls, glass scientific specimen cabinets, a high overhead astronomical clock recessed in the far wall, restrained suspended optical lenses. Clear dark open central space with distant architecture, no central foreground sculpture, no glowing orb, no portals, no characters, no text, no UI. Several rooms visible in depth through the arches, layered volumetric light from high left windows, delicate atmospheric dust, dark floor with subdued reflection. Camera near eye height, central vanishing point at 55 percent image height, all important geometry in middle far distance, lower third is quiet unoccupied floor. Realistic cinematic material surfaces and precise engraved mechanical construction, elegant museum scale rather than a spaceship or fantasy library. This is background behind real 3D emerald and brass foreground armillary sculpture: preserve negative space and avoid competing focal point. No white blockout shapes.

## v5.6.0 水面、真实纹理与分层动态 · 2026-10-14

从Poly Haven的公开资产接口取得 `rock_face`、`metal_plate`、`concrete_wall_004` 三套1k颜色、OpenGL法线与粗糙度JPEG，原文件存于assets/pbr，逐文件来源见sources.json。资产按[CC0许可](https://polyhaven.com/license)使用。石材在运行时降低暖色饱和度；研究所金属保留原黄铜、银与墨绿颜色，用贴图提供表面变化和细微法线，避免整件装置被深色钢板压黑。没有把素材示例渲染图用作纹理。

水面采用与本地Three.js r180匹配的官方Water模块（vendor/objects/Water.js，MIT），仅修改其Three导入为本地路径。lunar-water.js自定义波面与材质，在1024×512反射目标中实际绘制当下场景，含石柱、门、展台和月面。镜头移动时刷新，否则约15Hz；表面波纹仍每帧更新。它是平面反射与多尺度波纹，不是流体模拟、折射或完整水下体积。

月亮从固定绘景分离：moon-horizon-v56.png通过内置image_gen编辑v5.5远景，移除固定月亮；沿用已记录的ruins-moon.png作为独立月面，增加光晕、六层有独立深度和速度的云雾。云使用透明平面的噪声着色器，属于有空间视差的层，不是体积云模拟。残拱和柱顶碎块以七个动态实例组漂浮，减少动态时停止。

书册页纹、皮革封边、影像展台和放映机、工作终端键盘为原创Canvas与程序几何。未填写作品时显示用途图形，不能当成用户已完成的作品；用户上传图片继续替换展示预览。研究所补充转动的天文投影、悬挂镜片和低幅度光束运动。

背景配乐由soundscape.js原创音符合成：四个和弦循环、缓慢音垫、钟音与局部混响，三个世界交叉淡化，内容面板打开时降低音量。使用本地Web Audio，无外部录音或流媒体素材；默认静音，需要点击音乐图标开启。

### 去除固定月亮的最终编辑提示词

Use case: precise-object-edit. Asset type: far environment layer in a real-time 3D moonlit ruin scene. Edit the supplied landscape: remove only the circular moon and its localized bright halo from the upper left sky. Fill that region with continuous deep indigo sky and the same wispy cloud shapes. Preserve the wide composition, ancient ruined colonnades, mountains, cloud banks, horizon height, calm dark blue ocean, and all architectural details as closely as possible. Keep cool nighttime illumination throughout, with only a faint diffuse silver glow from offscreen upper left; no visible moon, no sun, no replacement bright disk or portal. No new buildings, foreground objects, text, interface or watermarks. This image will be a stationary far layer; a separate actual moon and moving clouds will be added in Three.js, so the sky must contain no moon at all.

## v5.7.0 月海泛舟 · 2026-10-20

根据用户最新指示停止魔术师施法动画，第二世界改为第一人称木船探索。船壳、内侧木肋、板凳、尖形船首、黄铜包边、双桨和船灯均为 lake-voyage.js 中的原创三维程序几何。木板与木纹使用本地 Canvas 生成1024×512纹理，不使用新下载的模型、图片或游戏资产。

船桨的入水、划动、提桨和回桨由实际行进距离控制；停止滚动时桨停止，环境仍可缓慢运动。船尾V形扰动、桨尖波圈和水纹为原创着色器近似，叠加既有真实平面反射，不是流体模拟。原有PBR、月面、绘景与音乐来源不变。中间石阶撤除，书台、放映器和三个环境装置移到航道两侧。减少动态关闭船体轻晃和新增运动。

## v5.8.0 工艺、可读性与划船修复 · 2026-10-23

新增 utopia-frieze-v58.png 为内置 image_gen 原创生成的象牙石天文浮雕横向材质，原始分辨率2172×724，已复制进本项目 assets。plaza-craft.js 将它映射到真实柱头、檐口和仪器柱座的凹入面板，配独立几何的压边、接缝和柱颈。图片不是整栋建筑或替代场景的背景；颜色图兼作小幅凹凸近似，未把它宣称为独立物理校准的PBR贴图组。

moon-craft.js 以既有CC0石材为底，程序生成星象刻纹、缺损和矿物颗粒；整体收分断柱、砌石断拱、凹槽边框和铜修补件为三维结构，重复件实例化。research-atelier.js 新增车制镜筒、原创光圈与刻度、灯腔、检修面板和支架，仍为原创程序模型；透明透镜未使用高成本折射。

划船采用完整船体世界逆矩阵和8段实际截面排除舱内水面，包含停船与反向；没有用遮住整屏的贴图掩盖穿舱。视角高度按世界独立保存，月海观看范围单独限制，避免船体遮屏或全船出画。只减少细小构件的阴影，不移除主体建筑与人物的投影。

### 浮雕材质最终生成提示词（内置工具）

Use case: photorealistic. Asset type: original architectural albedo texture strip to wrap actual three-dimensional ivory-stone cornices and column capitals in an elegant retro-utopian fantasy observatory. Generate a production-ready wide horizontal texture, ideally 3:1 aspect ratio, full bleed. Subject: masterfully carved shallow ivory limestone astronomical frieze, refined intertwined acanthus and laurel leaves with small armillary-sphere medallions, sun rays, crescent moons and orbital geometry; deliberate symmetrical repeating ornamental rhythm; tiny restrained worn ochre-gold leaf remnants confined to incised lines; mineral pores, softly worn carved edges, subtle ancient hairline cracks. Clearly sculpted relief and sophisticated variation, sophisticated museum-quality stone craft, harmonious cream and faint warm gray, not brightly white, not saturated. Orthographic view exactly head-on with no perspective. Very soft neutral shadowless illumination and extremely shallow relief shading only, no cast directional shadows, no vignette or bright reflections, no dramatic baked light. Seamless left-to-right repeat, matching edge motifs. No building, background, people, sky, water, UI, words, letters, numbers, logo or watermark. The whole image must be the stone artwork texture itself; no surrounding border or mockup sheet.

### 月相石刻材质

lunar-relief-v58.png 由内置 image_gen 原创生成，724×2172，已保存到项目 assets。它只提供近岸石刻面板的颜色和小幅凹凸近似，石柱、边框与柱础仍是真实三维。面板保持1:3画幅，既有独立石材法线和粗糙度贴图保留；自发光仅0.025，不用强发光掩盖受光。原来贴面被收分实心柱遮挡的问题已通过浅框安装位置修正。

最终提示词：

Use case: photorealistic. Asset type: original architectural surface texture for a narrow tall recessed carved panel on a three dimensional ancient moonlit ruin column. Produce a tall vertical strip, ideally 1:3 aspect ratio, full frame exactly head-on orthographic, no perspective. The entire image is a continuous weathered gray limestone relief with one coherent sculpted astronomical composition: a large raised circular lunar disk with subtly engraved craters near the upper third, seven smaller moon phases in an elegant vertical orbital arrangement, finely carved orbital ribbons descending into a geometric star compass near the bottom, restrained ancient intertwined leaf carving around the composition, worn border recesses. Sculptural craftsmanship with real mineral pores, chipped edges and pitted shallow relief, nuanced cool neutral gray and a few traces of tarnished muted bronze in grooves. Refined monumental mysterious fantasy observatory, believable antique stone not polished metal, not graphic line art, not blackboard symbols. Keep high local detail and a readable hierarchy, sophisticated sparing ornament, varied subtle wear. Neutral soft shadowless lighting suited to an albedo map, no blue night grading baked into texture, no hard cast shadows, no directional key light, no shiny reflection. Matchable plain stone outer edges. No visible architecture, columns, landscape, people, sky, water, text, letters, numbers, symbols resembling writing, logo, UI, mockup sheet or watermark.

### 角色绘制合并

character-batching.js 仅在人物身体、头部和每只手臂各自的刚性组件内合并同材质表面；175个模型网格降为15个，108484个三角形保留。头臂组件与动画轴未改，原始共享模型、材质和几何均未销毁。它是绘制组织优化，没有引入角色资产或降低模型精度。


### v5.8.1 人物精确拾取

绘制继续合并，精确拾取使用离线原始小构件的球体／包围盒和三角形检测。没有加入低精度点击代理或额外可见模型，头／臂关节、材质、贴图与三角形精度不变。该修改只控制计算路径，不引入素材。


v5.8.1另将月海已有无阴影侧前灯改为中性偏冷补光，便于读取石刻表面；没有新增灯光、阴影或素材，没有改动主月光、天空、曝光和石刻自发光。
