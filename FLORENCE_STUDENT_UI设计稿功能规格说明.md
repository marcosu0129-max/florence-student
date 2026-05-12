# Florence Student — UI 设计稿功能规格说明

> **用途**: UI 设计稿生成指南，不包含 UI 风格细节
> **覆盖范围**: 所有 17 个页面，每个页面内的所有区块、按钮、交互元素，以及完整的双向链接关系

---

## 导航结构总览

### 全局导航组件

#### TopNav（顶部导航栏）

桌面端（>= 1024px）显示，固定在页面顶部（`sticky`）。

| 元素 | 类型 | 链接目标 | 说明 |
|------|------|---------|------|
| Logo 文字 "UNIFI Studenti" | 文字链接 | `/` | 始终显示，左侧定位 |
| 导航链接 "Corsi" | 文字链接 | `/` | 桌面端显示，当前页高亮 |
| 导航链接 "Docenti" | 文字链接 | `/professors` | 桌面端显示 |
| 导航链接 "Recensioni" | 文字链接 | `/reviews` | 桌面端显示 |
| 导航链接 "Materiali" | 文字链接 | `/resources` | 桌面端显示（别名路由，实际指向 Materials 组件） |
| 返回按钮（← 箭头） | 图标按钮 | `backTo` prop 指定（默认 `/`） | 仅当 `showBack=true` 时显示 |
| 头像按钮（account_circle） | 图标按钮 | `/profile` | 始终显示，TopNav 右侧 |

#### BottomNav（底部 Tab 栏）

移动端（< 1024px）固定显示在页面底部。

| Tab | 图标 | 链接目标 | 说明 |
|-----|------|---------|------|
| Home | `home` | `/` | 当前页高亮 |
| Cerca | `search` | `/courses` | — |
| Materiali | `folder` | `/resources` | — |
| Profilo | `person` | `/profile` | — |

#### Layout 组件

通用布局包装器，`src/components/Layout.tsx`。

Props:

- `children`: 页面内容
- `showBottomNav`: 是否显示 BottomNav（默认 `true`）
- `showTopNav`: 是否显示 TopNav（默认 `true`）
- `showBack`: 是否显示返回按钮（默认 `false`）
- `backTo`: 返回按钮的目标路径（默认 `/`）
- `title`: 页面标题（传入 TopNav）
- `rightAction`: 右上角自定义元素

---

## 页面 1：Welcome 欢迎引导页

**路由**: `/welcome`
**布局**: `Layout showBottomNav={false}`，无 TopNav，无 BottomNav

### 区块 1：跳过按钮

| 元素 | 类型 | 行为 |
|------|------|------|
| "Salta" 文字按钮 | 文字按钮 | 点击 → 跳转 `/login` |

### 区块 2：轮播内容区（中央）

每页包含：

- 圆形图标容器（64px，手写体标题，描述文字）
- 5 页轮播内容（AnimatePresence 动画切换）：

| 页码 | 图标 | 标题 | 描述 |
|------|------|------|------|
| 1 | `school` | Florence Student | La tua guida per i corsi UNIFI. Valuta, condividi, scopri. |
| 2 | `star` | Valuta i Corsi | Leggi e scrivi recensioni per aiutare te e i tuoi colleghi a scegliere i corsi migliori. |
| 3 | `groups` | Trova i Migliori Docenti | Sfoglia il database completo dei professori UNIFI con valutazioni e consigli degli studenti. |
| 4 | `folder_open` | Condividi e Scarica Materiali | Accedi a appunti, esercizi e temi d'esame condivisi dalla comunita studentesca. |
| 5 | `favorite` | Salva i tuoi Corsi Preferiti | Tieni traccia dei corsi che ti interessano e delle tue esperienze di studio. |

### 区块 3：页面指示器

| 元素 | 行为 |
|------|------|
| 5 个圆点指示器 | 点击任意点 → 跳转到对应页；当前页圆点加宽，蓝色高亮 |

### 区块 4：操作按钮

| 按钮 | 文字 | 条件 | 行为 |
|------|------|------|------|
| "Indietro" | 次要按钮（左侧） | `currentSlide > 0` 时显示 | 点击 → `currentSlide - 1` |
| "Avanti" | 主要按钮（右侧） | 非最后一页 | 点击 → `currentSlide + 1` |
| "Inizia ora" | 主要按钮（全宽） | 最后一页（`isLastSlide`） | 点击 → 跳转 `/` |
| "Accedi" | 文字链接 | 最后一页（isLastSlide） | 点击 → 跳转 `/login` |

### 出站链接

| 源 | 目标 | 条件 |
|----|------|------|
| "Salta" 按钮 | `/login` | 始终 |
| "Inizia ora" 按钮 | `/` | 最后一页 |
| "Accedi" 链接 | `/login` | 最后一页 |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| 任意页面（首次访问） | → `/welcome` |

---

## 页面 2：Login 登录 / 注册页

**路由**: `/login`
**布局**: 无 Layout，无 TopNav，无 BottomNav（独立全屏页面）

### 左侧面板（桌面端 lg+）

纯展示，无交互元素。包含品牌 Logo、标题、宣传文案、3 个功能介绍卡片。

### 右侧面板（表单区）

#### 区块 1：Logo 和标题

| 元素 | 行为 |
|------|------|
| Logo 链接（移动端显示） | 点击 → 跳转 `/` |

标题随模式切换：

| 模式 | 标题 | 副标题 |
|------|------|--------|
| login | Bentornato | Entra nel tuo profilo studenti. |
| register | Crea account | Un profilo per corsi, recensioni e materiali. |

#### 区块 2：Google 登录按钮

| 元素 | 行为 |
|------|------|
| "Continua con Google" 按钮 | 点击 → 触发 `handleGoogleSignIn()` → Supabase Google OAuth → 跳转 `/auth/callback` |
| 加载中文本 | "Apertura Google..." |

#### 区块 3：邮箱登录 / 注册切换器

| 按钮 | 行为 |
|------|------|
| "Accedi" Tab | 切换到 login 模式，清空错误提示 |
| "Registrati" Tab | 切换到 register 模式，清空错误提示 |

#### 区块 4：表单字段

**登录模式（login）**：

| 字段 | 类型 | Placeholder | 验证 |
|------|------|-------------|------|
| Email 输入框 | email | nome@studenti.unifi.it | 必填，email 格式 |
| Password 输入框 | password（可切换显示） | Almeno 6 caratteri | 必填，最少 6 字符 |
| 显示/隐藏密码按钮 | Toggle 图标 | — | 切换 password/text 类型 |

**注册模式（register）**：

| 字段 | 类型 | Placeholder | 验证 |
|------|------|-------------|------|
| Nome completo 输入框 | text | Mario Rossi | 必填 |
| Email 输入框 | email | nome@studenti.unifi.it | 必填 |
| Password 输入框 | password（可切换） | Almeno 6 caratteri | 必填，最少 6 字符 |
| Conferma password 输入框 | password | Ripeti la password | 必填，与密码一致 |
| 显示/隐藏密码按钮 | Toggle 图标 | — | 切换显示 |

#### 区块 5：忘记密码

| 元素 | 行为 |
|------|------|
| "Password dimenticata?" 链接 | 登录模式显示；点击 → `handlePasswordReset()` → 发送重置邮件；提示 "Ti abbiamo inviato il link per reimpostare la password." |

#### 区块 6：错误和提示消息

| 条件 | 显示 |
|------|------|
| 表单验证失败 | 红色提示框（bg-red-50）显示错误文字 |
| 注册成功（待验证邮箱） | 绿色提示框（bg-green-50）显示 "Controlla la tua email per confermare la registrazione." |

#### 区块 7：提交按钮

| 按钮 | 文字 | 条件 | 行为 |
|------|------|------|------|
| 提交按钮 | 登录模式: "Accedi" / 注册模式: "Crea account" | 表单验证通过 | 点击 → `handleSubmit()` → 登录/注册逻辑 |

#### 区块 8：底部快捷入口

| 元素 | 行为 |
|------|------|
| "Modalita demo" 链接 + play_circle 图标 | 点击 → 跳转 `/` |
| 模式切换链接 | login 模式: "Registrati ora" / register 模式: "Ho gia un account" | 点击 → `switchMode()` 切换 |

### 出站链接

| 源 | 目标 |
|----|------|
| Logo 链接（移动端） | `/` |
| "Modalita demo" | `/` |
| Google OAuth 成功后 | `/auth/callback` → Supabase 处理后 → `/profile` |
| 登录成功 | `/profile` |
| 注册成功（已验证邮箱） | `/profile` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Welcome（"Accedi"） | → `/login` |
| Profile（"Esci dall'account"） | → `/login` |
| 任意页面（未登录用户点击需要认证的操作） | → `/login` |

---

## 页面 3：Home 首页

**路由**: `/`
**布局**: `Layout`（默认 TopNav + BottomNav）

### 区块 1：欢迎 Hero 卡片

包含：蓝色标签（Università degli Studi di Firenze）、手写体标题 "Ciao, Studente!"、副标题文字、右侧头像按钮。

| 元素 | 行为 |
|------|------|
| 右上角头像按钮（account_circle） | 点击 → `/profile` |

### 区块 2：搜索栏

| 元素 | 行为 |
|------|------|
| SearchBar（占位文字: "Es. Linguistica Generale, Prof. Rossi..."） | 点击 → 整体 Link 包裹 → 跳转 `/courses` |

### 区块 3：快捷统计卡片（3 列）

| 卡片 | 链接 | 行为 |
|------|------|------|
| "Corsi"（课程数量） | `→ /courses` | 点击 → `/courses` |
| "Media Voti"（平均评分） | 无链接（纯展示） | — |
| "Preferiti"（收藏数） | `→ /profile/courses` | 点击 → `/profile/courses` |

### 区块 4：教授浏览入口 Banner

| 元素 | 行为 |
|------|------|
| 深蓝渐变 Banner（固定显示，不依赖数据） | 点击 → `/professors` |
| 右侧箭头图标 | 同上，带呼吸动画 |

### 区块 5：精选课程列表

| 元素 | 行为 |
|------|------|
| Section 标题 "Insegnamenti in Evidenza" | 纯展示 |
| "Vedi tutti →" 链接 | 点击 → `/courses` |
| 课程卡片列表（前 4 门） | 每张卡片 → `/courses/:id` |

每张 `CourseCard` 包含的内部交互：

- 点击卡片 → `/courses/:id`
- 卡片右上角 Pushpin 装饰
- 右上角 CFU 标签（纯展示）
- 底部箭头（带动画）
- 显示：课程名、教授名、评分、标签（学年/学期/必修/选修）

### 区块 6：专业课程分组列表

| 元素 | 行为 |
|------|------|
| Section 标题 "Corsi di Laurea" | 纯展示 |
| 专业卡片（5 个，按 programs 顺序） | — |
| "Vedi tutti →" 链接 | 点击 → `/programs/:code` |
| 专业课程列表（最多显示前 3 门） | 每门课程名 → `/courses/:id` |

每个专业卡片内：

- 专业代码标签（LM-92 等）
- 专业名称
- 课程数量
- 课程名 + CFU（可点击 → 课程详情）
- "+N altri" 文字（如果 > 3 门）

### 出站链接

| 源 | 目标 |
|----|------|
| 头像按钮 | `/profile` |
| SearchBar 包裹链接 | `/courses` |
| Corsi 统计卡片 | `/courses` |
| Preferiti 统计卡片 | `/profile/courses` |
| 教授 Banner | `/professors` |
| "Vedi tutti"（精选课程） | `/courses` |
| 课程卡片 | `/courses/:id` |
| "Vedi tutti"（专业） | `/programs/:code` |
| 课程名（专业区块内） | `/courses/:id` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| App 根路径默认加载 | → `/` |
| TopNav Logo | → `/` |
| CourseDetail（返回按钮） | → `/` |
| ProgramDetail（返回按钮） | → `/` |

---

## 页面 4：Courses 课程列表页

**路由**: `/courses`
**布局**: 无 Layout 包装，TopNav + BottomNav + Footer，手动控制布局

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| 标题（H1 Kalam） | Esplora l'Offerta Formativa |
| 副标题 | "{N} insegnamenti disponibili"（动态课程总数） |

### 区块 2：搜索栏

| 元素 | 行为 |
|------|------|
| SearchBar（受控组件） | 输入 → 过滤课程列表 |
| 占位文字 | "Cerca corso, codice o docente..." |
| 按课程名或教授名过滤 | — |

### 区块 3：筛选器

#### Anno 筛选（学年）

| 按钮 | 行为 |
|------|------|
| "Tutti" | 显示所有学年 |
| "1°" | 仅显示 yearLevel === 1 的课程 |
| "2°" | 仅显示 yearLevel === 2 的课程 |
| "3°" | 仅显示 yearLevel === 3 的课程 |

#### Semestre 筛选（学期）

| 按钮 | 行为 |
|------|------|
| "Tutti" | 显示所有学期 |
| "I Sem" | 显示包含 "I" 或 "1" 的学期 |
| "II Sem" | 显示包含 "II" 或 "2" 的学期 |
| "Annuale" | 显示 Annuale 课程 |

#### 搜索结果提示

当 `searchQuery` 非空时显示：`"{N} risultato/i per \"{keyword}\""`

#### 重置按钮

| 元素 | 行为 |
|------|------|
| "Resetta filtri" 文字按钮 | 仅在 `searchQuery` 非空时显示；点击 → 清空所有过滤条件 |

### 区块 4：课程列表 / 空状态

| 状态 | 显示 |
|------|------|
| 加载中 | 3 个跳动圆点 + "Caricamento corsi..." |
| 有结果 | 网格布局（桌面端 2 列，移动端 1 列），每项为 CourseCard |
| 空结果 | 图标 + "Nessun risultato" + "Prova a modificare i filtri..." + "Resetta filtri" |

每个 CourseCard 链接 → `/courses/:id`

### 区块 5：Footer

| 链接 | 目标 |
|------|------|
| "Chi siamo" | `/about` |
| "Privacy" | `#`（锚点） |
| "Contatti" | `#`（锚点） |
| "Accessibilita" | `#`（锚点） |

### 出站链接

| 源 | 目标 |
|----|------|
| CourseCard | `/courses/:id` |
| "Chi siamo" | `/about` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| BottomNav "Cerca" | → `/courses` |
| Home SearchBar | → `/courses` |
| Home "Vedi tutti" | → `/courses` |

---

## 页面 5：CourseDetail 课程详情页

**路由**: `/courses/:id`
**布局**: `Layout showBack={true} backTo="/"`

### 区块 1：课程头部卡片

| 元素 | 说明 |
|------|------|
| 专业代码标签（蓝底白字圆角） | 来自 `course.programCode` |
| 课程名称（H1 Kalam） | 来自 `course.name` |
| 教授名 + CFU + 学期（副标题） | 格式: "{professor} · {credits} CFU · {semester}" |
| 右上角收藏心形按钮 | 切换收藏状态（localStorage），图标从空心变实心 |
| 标签行：Obbligatorio/A Scelta（绿底）、学年、学期 | — |

#### 收藏按钮行为

| 当前状态 | 点击后 |
|---------|--------|
| 未收藏（空心灰色） | 写入 localStorage → 变为实心红色（animate-heartbeat） |
| 已收藏（实心红色） | 删除 localStorage → 变回空心灰色 |

### 区块 2：课程描述

| 元素 | 说明 |
|------|------|
| "Descrizione del Corso" 标题 | — |
| 描述文字 | 来自 `course.description`，白色卡片背景 |

### 区块 3：三维评分看板

3 张独立卡片（难度 / 讲课 / 给分）：

| 卡片 | 图标 | 颜色 | 数据来源 |
|------|------|------|---------|
| Difficoltà | `trending_up` | 红色 #FF453A | 从 reviews 计算平均难度 |
| Didattica | `school` | 蓝色 #2e5ea2 | 从 reviews 计算平均讲课 |
| Voto Finale | `gavel` | 绿色 #30D158 | 从 reviews 中的 grade 字段平均 |

每张卡片：数字评分 + /5 + StarRatingDisplay + 评价数量

### 区块 4：授课教授卡片

| 元素 | 行为 |
|------|------|
| 教授头像（渐变紫圆形 + 首字母缩写） | 纯展示 |
| 教授姓名 | 纯展示 |
| 院系（副文字） | 纯展示 |
| Bio（最多 2 行截断） | 纯展示 |
| 星级 + 授课数量 | 纯展示 |
| 右侧箭头 | 纯展示（无链接跳转，实际点击整个卡片） |
| **整个卡片** | **点击 → `/professors/:professorId`** |

### 区块 5：Tab 切换

| Tab | 行为 |
|-----|------|
| "Recensioni ({N})" | 选中 → 显示评价列表 |
| "Materiali (0)" | 选中 → 显示资料空状态（硬编码为 0） |

#### 评价 Tab 内容

| 状态 | 显示 |
|------|------|
| 无评价 | 空状态：图标 + "Nessuna recensione" + "Sii il primo a lasciare una recensione!" |
| 有评价 | 列表展示 `ReviewCard`，每个包含：作者头像、姓名、日期、三维评分、内容、考试技巧、Helpful 计数器 |

#### 资料 Tab 内容

固定显示空状态：图标 + "Nessun materiale" + "Prova a cercare altri materiali o contribuisci tu!"

### 区块 6：悬浮按钮（FAB）

| 元素 | 行为 |
|------|------|
| "Scrivi recensione" 悬浮按钮（右下角固定） | 点击 → `/courses/:id/review` |
| 图标 + 文字 | icon: `edit` |

位置：`bottom-24 md:bottom-8`，固定定位，z-40

### 出站链接

| 源 | 目标 |
|----|------|
| 收藏心形按钮 | 无（本地状态切换） |
| 教授卡片 | `/professors/:professorId` |
| FAB "Scrivi recensione" | `/courses/:id/review` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Home 课程卡片 | → `/courses/:id` |
| Home 专业区块内课程名 | → `/courses/:id` |
| Courses 课程卡片 | → `/courses/:id` |
| ProgramDetail 课程卡片 | → `/courses/:id` |
| ProfessorDetail 课程卡片 | → `/courses/:id` |
| AllReviews 中课程名 | → `/courses/:id` |
| MyReviews 中课程名 | → `/courses/:id` |
| Profile 最近活动课程名 | → `/courses/:id` |

---

## 页面 6：AddReview 发布评价页

**路由**: `/courses/:id/review`
**布局**: `Layout showBack={true} backTo="/courses/:id"`

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| "La tua Recensione"（居中 H1 Kalam） | — |
| 副标题 | "per {courseName}" |

### 区块 2：三维评分输入

3 个 `StarRatingInput` 组件：

| 维度 | 图标 | 图标颜色 | 标签描述 |
|------|------|---------|---------|
| Difficolta | `trending_up` | text-rose-500 | Molto facile / Facile / Medio / Difficile / Molto difficile |
| Voto finale (esame) | `grade` | text-amber-500 | Molto severo / Severo / Equo / Generoso / Molto generoso |
| Qualita della didattica | `school` | text-[#2e5ea2] | Pessima / Scarso / Normale / Buona / Eccellente |

每个 `StarRatingInput`：

- 5 个可点击星形图标
- 当前选中星高亮为对应颜色
- 描述文字随分值变化

### 区块 3：体验描述

| 元素 | 说明 |
|------|------|
| 标签 "Racconta la tua esperienza" | — |
| Textarea（5 行） | 输入评价内容，placeholder: "Scrivi qui la tua esperienza..." |
| 字符计数 | "{N}/20"，红色 < 20，绿色 >= 20 |
| 验证规则 | 最少 20 字符 |

### 区块 4：考试技巧（选填）

| 元素 | 说明 |
|------|------|
| 标签 "Consigli per gli studenti (opzionale)" | 绿色便签纸卡片背景 |
| Textarea（3 行） | 输入考试技巧，placeholder: "Un paio di dritte per chi sta per affrontare questo esame..." |
| 提示文字 | "Aiuta i tuoi colleghi con consigli pratici!" |

### 区块 5：匿名开关

| 元素 | 说明 |
|------|------|
| Toggle 开关（胶囊形） | 控制 `isAnonymous` 状态 |
| 标签 "Recensione anonima" | — |
| 提示文字 | "Le recensioni anonime proteggono la tua privacy" |

### 区块 6：错误提示

| 条件 | 显示 |
|------|------|
| 提交失败 | 红色提示框（bg-rose-50）显示错误文字 |

### 区块 7：操作按钮（底部）

| 按钮 | 位置 | 文字 | 行为 |
|------|------|------|------|
| "Annulla" | 左侧 | 红色文字 | 点击 → `navigate(-1)`（返回上一页） |
| "Invia Recensione" | 右侧 | 蓝色实心按钮 | 点击 → `handleSubmit()` → 验证并提交 |

**提交验证**：

- 内容最少 20 字符
- 三个维度评分（默认 3，可不选）

**提交成功行为**：跳转 `/courses/:id`（课程详情页）

### 出站链接

| 源 | 目标 |
|----|------|
| Annulla | 返回上一页（`/courses/:id`） |
| 提交成功 | `/courses/:id` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| CourseDetail FAB | → `/courses/:id/review` |

---

## 页面 7：Professors 教授目录页

**路由**: `/professors`
**布局**: `Layout`（默认）

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| 标题 "Rubrica Docenti" | — |
| 副标题 | "Cerca i professori, visualizza i loro corsi associati e leggi i consigli degli studenti." |

### 区块 2：搜索栏

| 元素 | 行为 |
|------|------|
| SearchBar（受控） | 按教授姓名或院系过滤 |

### 区块 3：院系筛选按钮

| 元素 | 行为 |
|------|------|
| "Tutti i Dipartimenti" | 显示所有教授 |
| 其他院系名称（动态生成） | 按院系过滤 |

每个按钮样式：选中态蓝色实心，未选中白色描边

### 区块 4：教授列表

| 状态 | 显示 |
|------|------|
| 加载中 | 跳动圆点 + "Caricamento docenti..." |
| 空结果 | 图标 + "Nessun docente trovato" + "Prova con altre parole chiave o filtri." |
| 有结果 | `ProfessorRow` 列表，每个 → `/professors/:id` |

每个 `ProfessorRow` 包含：

- 渐变头像（首字母缩写，不同教授不同颜色）
- 教授姓名
- 院系
- 授课数量 + 星级
- 专业代码标签（多个）

### 区块 5：分页控件

固定 "Pagina 1 di 1"，上一页/下一页按钮（`disabled` 状态）。

### 出站链接

| 源 | 目标 |
|----|------|
| ProfessorRow（整行） | `/professors/:id` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Home 教授 Banner | → `/professors` |
| TopNav "Docenti"（桌面端） | → `/professors` |
| CourseDetail 教授卡片 | → `/professors/:professorId` |

---

## 页面 8：ProfessorDetail 教授详情页

**路由**: `/professors/:id`
**布局**: `Layout showBack={true} backTo="/professors"`

### 区块 1：教授头部

| 元素 | 说明 |
|------|------|
| 头像（渐变紫，80px，首字母缩写） | 纯展示 |
| 教授姓名（H1 Kalam） | 纯展示 |
| 院系（副文字） | 纯展示 |
| 星级评分 + 显示数值 | 纯展示 |

### 区块 2：联系信息（2 列网格）

| 卡片 | 内容 | 行为 |
|------|------|------|
| Email 卡片 | 图标 + "Email" + 邮箱地址 | `mailto:` 链接 |
| 办公室卡片 | 图标 + "Ufficio" + 办公室位置 | 纯展示 |

### 区块 3：个人简介

| 元素 | 说明 |
|------|------|
| "Biografia" 标题 + person 图标 | — |
| Bio 内容文字 | 纯展示 |

### 区块 4：所属专业

| 元素 | 说明 |
|------|------|
| "Corsi di Laurea (N)" 标题 + school 图标 | — |
| 专业代码标签（蓝底白字） | 纯展示 |

### 区块 5：授课课程列表

| 元素 | 说明 |
|------|------|
| "Insegnamenti (N)" 标题 + menu_book 图标 | — |
| 课程卡片网格（2 列） | 每个 CourseCard → `/courses/:id` |

### 区块 6：教授收到的评价

| 元素 | 说明 |
|------|------|
| "Recensioni (N)" 标题 + forum 图标 | — |
| 评价卡片列表 | 每个 ReviewCard（含 Helpful 计数器） |

### 出站链接

| 源 | 目标 |
|----|------|
| Email 链接 | `mailto:prof.email` |
| CourseCard（授课列表） | `/courses/:courseId` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Professors 列表行 | → `/professors/:id` |
| CourseDetail 教授卡片 | → `/professors/:professorId` |
| Home 教授 Banner | → `/professors` |

---

## 页面 9：AllReviews 全站评价流

**路由**: `/reviews`
**布局**: `Layout showBack={true} backTo="/"`

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| 标题 "Tutte le Recensioni" | — |
| 副标题 | "{N} recensioni dalla comunita studentesca" |

### 区块 2：评价列表 / 空状态

| 状态 | 显示 |
|------|------|
| 加载中 | 跳动圆点 |
| 空结果 | 图标 + "Nessuna recensione" + "Le recensioni appariranno qui." + "Esplora corsi →" |
| 有结果 | 网格布局（桌面端 2 列），每个评价卡片 |

每个评价卡片（AllReviews 样式）包含：

- 作者头像（首字母） + 姓名 + 日期
- 课程名链接 → `/courses/:courseId`
- 难度标签 + 讲课标签 + 给分标签
- 评价内容（最多 3 行截断）
- 考试技巧引用（如果有）
- 底部：Helpful 计数 + 5 星评分

### 出站链接

| 源 | 目标 |
|----|------|
| 课程名链接 | `/courses/:courseId` |
| "Esplora corsi →" | `/` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| TopNav "Recensioni"（桌面端） | → `/reviews` |

---

## 页面 10：Profile 个人主页

**路由**: `/profile`
**布局**: `Layout`（默认）

### 区块 1：用户信息头部

| 元素 | 说明 |
|------|------|
| 用户头像（蓝白渐变圆形，96px，首字母 M） | 纯展示 |
| 用户名 "Utente Demo"（H1 Kalam） | 纯展示 |
| 副文字 "modalita demo" | 纯展示 |
| 学院标签（蓝底白字圆角） | 纯展示，固定 "Scuola di Studi Umanistici" |
| "Modifica Profilo" 按钮 | 点击 → `/profile/edit` |

### 区块 2：统计卡片（3 列）

| 卡片 | 数值 | 链接 | 目标 |
|------|------|------|------|
| Corsi Salvati | 收藏数量（getSavedCourseIds().length） | StatCard 带链接 | `/profile/courses` |
| Recensioni | 评价数量（fetchUserReviews().length） | StatCard 带链接 | `/profile/reviews` |
| Materiali | 0（硬编码） | 无链接 | — |

### 区块 3：最近活动

| 状态 | 显示 |
|------|------|
| 无评价 | 空状态便签纸："Nessuna attivita recente. Salva un corso e lascia una recensione!" |
| 有评价 | 最近 2 条最近活动卡片 |

每个最近活动卡片包含：

- 蓝色图标
- 课程名链接 → `/courses/:courseId`
- "Hai lasciato una recensione."
- 星级显示

### 区块 4：设置列表

| 链接 | 目标 | 图标 | 图标颜色 |
|------|------|------|---------|
| "Notifiche" | `/notifications` | `notifications` | text-rose-500 |
| "Privacy e Sicurezza" | `/settings` | `lock` | text-[#2e5ea2] |
| "Supporto" | `/settings` | `help` | text-emerald-500 |
| "Info" | `/about` | `info` | text-slate-400 |

每行右侧箭头图标（`chevron_right`）

### 区块 5：退出登录

| 元素 | 行为 |
|------|------|
| 退出登录按钮（红色图标 + "Esci dall'account"） | 点击 → 跳转 `/login` |

### 出站链接

| 源 | 目标 |
|----|------|
| "Modifica Profilo" 按钮 | `/profile/edit` |
| "Corsi Salvati" 统计卡片 | `/profile/courses` |
| "Recensioni" 统计卡片 | `/profile/reviews` |
| 最近活动课程名 | `/courses/:courseId` |
| "Notifiche" 行 | `/notifications` |
| "Privacy e Sicurezza" 行 | `/settings` |
| "Supporto" 行 | `/settings` |
| "Info" 行 | `/about` |
| 退出登录按钮 | `/login` |
| TopNav 头像按钮 | `/profile` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| BottomNav "Profilo" | → `/profile` |
| TopNav 头像 | → `/profile` |
| 任意页面登录成功后 | → `/profile` |

---

## 页面 11：MyReviews 我的评价

**路由**: `/profile/reviews`
**布局**: `Layout showBack={true} backTo="/profile"`

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| "Le mie Recensioni"（H1 Kalam） | — |
| 副标题 | "{N} recensione/i lasciat/e" |

### 区块 2：评价列表 / 空状态

| 状态 | 显示 |
|------|------|
| 加载中 | 跳动圆点 |
| 空结果 | 图标 + "Nessuna recensione" + "Non hai ancora lasciato nessuna recensione." + "Esplora corsi →" |
| 有评价 | 评价卡片列表 |

每个评价卡片包含：

- 课程名链接 → `/courses/:courseId`
- 星级显示（按讲课评分）
- 评价内容（最多 3 行截断）
- 考试技巧（如果有）
- "Modifica" 按钮 → `/courses/:courseId/review`
- "Elimina" 按钮 → **点击无行为（onClick 未实现）**

### 出站链接

| 源 | 目标 |
|----|------|
| 课程名链接 | `/courses/:courseId` |
| "Modifica" 按钮 | `/courses/:courseId/review` |
| "Esplora corsi →" | `/` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Profile 统计卡片 "Recensioni" | → `/profile/reviews` |

---

## 页面 12：MyCourses 收藏课程

**路由**: `/profile/courses`
**布局**: `Layout showBack={true} backTo="/profile"`

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| "I Miei Corsi"（H1 Kalam） | — |
| 副标题 | "{N} corso/i salvat/i" |

### 区块 2：课程列表 / 空状态

| 状态 | 显示 |
|------|------|
| 加载中 | 跳动圆点 + "Caricamento..." |
| 空结果 | 空心心形图标 + "Nessun corso salvato" + "Salva i corsi che ti interessano..." + "Esplora i corsi →" |
| 有结果 | 网格布局（2 列），每项为收藏课程卡片 |

每个收藏课程卡片包含：

- 右上角取消收藏按钮（实心心形 → 点击 → 移除并更新列表）
- CourseCard（点击 → `/courses/:id`）
- "Scrivi recensione" 按钮 → `/courses/:courseId/review`

#### 取消收藏按钮行为

| 点击后 |
|--------|
| 调用 `unsaveCourse(courseId)` |
| 从 localStorage 中移除 |
| UI 中立即过滤掉该课程 |
| 列表更新 |

### 出站链接

| 源 | 目标 |
|----|------|
| "Esplora i corsi →" | `/courses` |
| CourseCard | `/courses/:id` |
| "Scrivi recensione" 按钮 | `/courses/:id/review` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Profile 统计卡片 "Corsi Salvati" | → `/profile/courses` |
| Home 统计卡片 "Preferiti" | → `/profile/courses` |

---

## 页面 13：Settings 设置页

**路由**: `/settings`
**布局**: `Layout showBack={true} backTo="/profile"`

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| "Impostazioni"（H1 Kalam） | — |

### 区块 2：Account 区块

| 链接 | 目标 | 图标 |
|------|------|------|
| "Modifica Profilo" | `/profile/edit` | `person` |
| "Privacy e Sicurezza" | 无链接（纯展示行） | `lock` |

### 区块 3：Preferenze 区块（3 个 Toggle）

| 设置项 | 图标 | 图标颜色 | 默认值 |
|--------|------|---------|--------|
| Notifiche Push | `notifications` | text-rose-500 | `true` |
| Notifiche Email | `mail` | text-[#2e5ea2] | `true` |
| Modalita Anonima | `visibility_off` | text-slate-400 | `false` |

每个 Toggle：胶囊形开关，滑动切换状态（本地 useState，无持久化）

### 区块 4：Lingua 区块

| 元素 | 行为 |
|------|------|
| "Lingua" 行 | 无实际行为（语言切换未实现） |
| 显示 "Italiano" | 纯展示 |
| 右侧箭头 | 纯展示 |

### 区块 5：Info 入口

| 元素 | 行为 |
|------|------|
| "Info su Florence Student" 卡片 | 点击 → `/about` |
| 版本号 | 显示 "v1.0.0" |

### 区块 6：Logout 按钮

| 元素 | 行为 |
|------|------|
| "Logout" 按钮（红色） | 点击 → 跳转 `/login` |

### 出站链接

| 源 | 目标 |
|----|------|
| "Modifica Profilo" | `/profile/edit` |
| "Info su Florence Student" | `/about` |
| Logout | `/login` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Profile 设置列表 "Privacy e Sicurezza" | → `/settings` |
| Profile 设置列表 "Supporto" | → `/settings` |
| Profile 设置列表 "Info" | → `/about` |

---

## 页面 14：Notifications 通知中心

**路由**: `/notifications`
**布局**: `Layout showBack={true} backTo="/profile"`

### 区块 1：页面标题 + 全标已读

| 元素 | 说明 |
|------|------|
| "Notifiche"（H1 Kalam） | — |
| "Segna tutte come lette" 按钮 | 仅当有未读通知时显示；点击 → 无实际行为（硬编码数据） |

### 区块 2：通知列表（4 条静态数据）

每条通知卡片：

| 元素 | 说明 |
|------|------|
| 类型图标（彩色背景） | 来自静态数据 |
| 通知标题 | — |
| 通知内容 | — |
| 时间 | — |
| 未读指示器（蓝色圆点，呼吸动画） | 仅未读通知显示 |

#### 通知列表数据

| # | 图标 | 标题 | 内容 | 时间 | 状态 |
|---|------|------|------|------|------|
| 1 | `rate_review` | Nuova risposta alla tua recensione | "Qualcuno ha trovato utile la tua recensione su Linguistica Generale." | 2 ore fa | 未读 |
| 2 | `folder` | Nuovo materiale disponibile | "Il Prof. Verdi ha caricato nuove slide per Letteratura Italiana I." | Ieri | 未读 |
| 3 | `school` | Nuovo corso disponibile | "E' stato aggiunto Semiotica del Testo al tuo programma." | 3 giorni fa | 已读 |
| 4 | `settings` | Aggiornamento app | "Florence Student v1.0.1 ora disponibile..." | 1 settimana fa | 已读 |

未读卡片：蓝色边框 `border-[#2e5ea2]`
已读卡片：默认黑色边框 `border-primary`

### 出站链接

无

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Profile "Notifiche" 行 | → `/notifications` |

---

## 页面 15：Materials 资源中心

**路由**: `/materials`（别名：`/resources`）
**布局**: `Layout`（默认）

### 区块 1：页面标题

| 元素 | 内容 |
|------|------|
| "Centro Materiali"（H1 Kalam） | — |
| 副标题 | "Scarica appunti, esercizi e temi d'esame condivisi dagli studenti." |

### 区块 2：搜索栏

| 元素 | 行为 |
|------|------|
| SearchBar（受控） | 按标题或上传者过滤 |

### 区块 3：类型筛选按钮（横向滚动）

| 按钮 | 过滤值 |
|------|--------|
| "Tutti" | all |
| "Dispense" | pdf |
| "Esercizi" | doc |
| "Esami" | exam（无匹配数据） |
| "Appunti" | notes（映射到 doc） |
| "Audio" | audio |

### 区块 4：资料列表 / 空状态

| 状态 | 显示 |
|------|------|
| 空结果 | 图标 + "Nessun materiale" + "Prova a cercare con altre parole..." |
| 有结果 | 网格布局（2 列），每个资料卡片 |

每个资料卡片包含：

- 类型标签（PDF/DOC/AUDIO，按类型显示不同颜色）
- 日期
- 资料标题
- 描述（最多 2 行截断）
- 上传者 + 下载次数 + 文件大小
- "Scarica" 按钮 → 纯展示（点击无行为）

类型图标映射：

| 类型 | 图标 |
|------|------|
| PDF | `picture_as_pdf`（红色） |
| DOC | `description`（绿色） |
| AUDIO | `audio_file`（粉色） |
| VIDEO | `video_file`（蓝色） |
| IMAGE | `image`（橙色） |

### 区块 5：上传 FAB

| 元素 | 行为 |
|------|------|
| 圆形 + 图标（add） | 点击无行为（未实现上传功能） |

位置：`fixed bottom-24 right-4`，固定定位，z-40

### 出站链接

无

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| BottomNav "Materiali" | → `/materials` |
| TopNav "Materiali"（桌面端） | → `/resources` |

---

## 页面 16：ProgramDetail 专业详情页

**路由**: `/programs/:code`
**布局**: `Layout showBack={true} backTo="/"`

### 区块 1：专业头部卡片

| 元素 | 说明 |
|------|------|
| 专业代码标签（蓝底白字圆角） | 来自 programs 数组 |
| 专业名称（H1 Kalam） | — |
| 学院名称（副文字） | — |

### 区块 2：统计数据条（3 列）

| 卡片 | 数值 | 说明 |
|------|------|------|
| Insegnamenti | `programCourses.length` | 该专业课程总数 |
| Obbligatori | `requiredCourses.length` | 必修课数量 |
| CFU Totali | `program.totalCredits` | 固定数值（120 或 180） |

### 区块 3：信息区

| 行 | 图标 | 标签 | 内容 |
|----|------|------|------|
| 1 | `school` | Facolta | `program.faculty` |
| 2 | `person` | Presidente | `program.president` |

### 区块 4：必修课程列表

| 元素 | 说明 |
|------|------|
| 绿色圆点 + "Insegnamenti Obbligatori"（H2 Kalam） | — |
| CourseCard 网格（2 列） | 每个 → `/courses/:id` |

### 区块 5：选修课程列表

| 元素 | 说明 |
|------|------|
| 蓝色圆点 + "Insegnamenti a Scelta"（H2 Kalam） | 仅当有选修课时显示 |
| CourseCard 网格（2 列） | 每个 → `/courses/:id` |

每个 CourseCard 包含：

- 课程名 + 右上角 CFU 标签
- 标签：学年、学期、必修/选修
- 描述（2 行截断）
- 教授姓名 + 头像缩写
- 评分（如果有）
- 底部箭头

### 出站链接

| 源 | 目标 |
|----|------|
| CourseCard（必修课） | `/courses/:id` |
| CourseCard（选修课） | `/courses/:id` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Home 专业区块 "Vedi tutti" | → `/programs/:code` |
| CourseDetail（返回按钮） | → `/` |

---

## 页面 17：About 关于页面

**路由**: `/about`
**布局**: `Layout showBack={true} backTo="/profile"`

### 区块 1：头部

| 元素 | 说明 |
|------|------|
| 蓝色渐变圆形图标（school） | 纯展示 |
| "Florence Student"（H1 Kalam） | — |
| "Versione 1.0.0" | — |
| 便签纸卡片：标语 | — |

### 区块 2：关于我们

| 元素 | 内容 |
|------|------|
| "Chi siamo"（H2） | — |
| 两段描述文字 | 关于 Florence Student 平台的介绍 |

### 区块 3：功能列表

4 个功能介绍行，每行包含图标 + 文字：

| 图标 | 文字 |
|------|------|
| `star` | Recensioni dettagliate dei corsi con valutazioni multidimensionali |
| `groups` | Rubrica docenti con biografie e valutazioni della didattica |
| `folder_open` | Materiali didattici condivisi dalla comunita studentesca |
| `favorite` | Salvataggio dei corsi preferiti per un facile accesso |

### 区块 4：联系方式

| 元素 | 行为 |
|------|------|
| Email 链接 | `mailto:info@florence-student.it` |
| 网站链接 | `#`（锚点，无实际页面） |

### 区块 5：Footer

纯展示文字，无链接。

### 出站链接

| 源 | 目标 |
|----|------|
| Email | `mailto:info@florence-student.it` |
| 网站 | `#` |

### 入站链接

| 来源页面 | 链接 |
|---------|------|
| Settings "Info su Florence Student" | → `/about` |
| Profile "Info" 行 | → `/about` |
| Courses Footer "Chi siamo" | → `/about` |

---

## 组件级链接汇总（内嵌在组件中）

### CourseCard（课程卡片组件）

| 属性 | 值 |
|------|-----|
| 主交互 | 点击 → `/courses/:id`（`navigate` 或 Link） |
| `onClick` prop | 覆盖默认导航行为（CourseDetail 等页面传入自定义 onClick） |

### ProfessorRow（教授行组件）

| 属性 | 值 |
|------|-----|
| 主交互 | 点击 → `/professors/:id` |

### ReviewCard（评价卡片组件）

| 元素 | 行为 |
|------|------|
| Helpful/Utile 按钮 | 本地 `liked` 状态切换 + 计数器 +1（无 API 调用） |
| 其他元素 | 纯展示，无链接 |

### StarRatingDisplay（只读星级）

无链接，纯展示。

### StarRatingInput（交互式星级）

无链接，用于 AddReview 页面。

### StatCard（统计卡片）

| 属性 | 值 |
|------|-----|
| `href` prop | 可选链接目标（如有则整张卡片可点击） |

### EmptyState（空状态）

无链接，纯展示占位。

### Pushpin（图钉装饰）

无链接，纯装饰。

### SearchBar（搜索栏）

| 属性 | 值 |
|------|-----|
| `onChange` | 回调，父组件控制过滤 |
| `value` | 受控值 |
| `placeholder` | 占位文字 |
| `Link` 包裹（可选） | 如 Home 的 SearchBar 整体可点击跳转 |

---

## 完整双向链接关系矩阵

```
来源 \ 目标  WELCOME  LOGIN  HOME   COURSES  COURSE/:id  COURSE/:id/REVIEW  PROFESSORS  PROF/:id  REVIEWS  PROFILE  PROFILE/REV  PROFILE/COURSES  PROFILE/EDIT  SETTINGS  NOTIFICATIONS  MATERIALS  PROGRAM/:code  ABOUT
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
WELCOME              —      X      X       —         —              —              —         —        —      —         —            —             —           —            —          —         —
LOGIN                —      —      —       —         —              —              —         —        —      —         —            —             —           —           —          —         —
HOME                 —      —      —       X         X(Card)        —              X         —        —      X         —            X             —           —           —          X(Prof)  X(Code)
COURSES              —      —      —       —         X(Card)        —              —         —        —      —         —            —             —           —           —          —         X(Chi siamo)
COURSE/:id           —      —      —       —         —              X(FAB)        —         X(Prof)  —      —         —            —             —           —           —          —         —
COURSE/:id/REVIEW    —      —      —       —         X             —              —         —        —      —         —            —             —           —           —          —         —
PROFESSORS           —      —      —       —         —              —              —         X        —      —         —            —             —           —           —          —         —
PROF/:id             —      —      —       —         X(Card)        —              —         —        —      —         —            —             —           —           —          —         —
REVIEWS              —      —      X        —         X(Course)      —              —         —        —      —         —            —             —           —           —          —         —
PROFILE              —      X      —       —         X(Activity)    —              —         —        —      —         X             X             X           X           X          —         X
PROFILE/REVIEWS      —      —      X        —         X(Course)      X(Edit)        —         —        —      —         —            —             —           —           —          —         —
PROFILE/COURSES      —      —      X        X         X(Card)        X(Review)      —         —        —      —         —            —             —           —           —          —         —
PROFILE/EDIT         —      —      —       —         —              —              —         —        —      —         —            —             —           —           —          —         —
SETTINGS             —      X      —       —         —              —              —         —        —      —         —            —             —           —           —          —         X
NOTIFICATIONS        —      —      —       —         —              —              —         —        —      X         —            —             —           —           —          —         —
MATERIALS            —      —      —       —         —              —              —         —        —      —         —            —             —           —           —          —         —
PROGRAM/:code        —      —      X        —         X(Card)        —              —         —        —      —         —            —             —           —           —          —         —
ABOUT                —      —      —       —         —              —              —         —        —      —         —            —             —           —           —          —         —
```

**图例**: `X` = 有链接；`X(具体)` = 有链接且指向特定元素；`—` = 无链接

---

## 全局状态管理（localStorage）

| Key | 存储内容 | 使用的页面 |
|-----|---------|-----------|
| `florence:saved-course-ids` | 收藏课程 ID 数组（JSON） | CourseDetail（收藏按钮）、MyCourses（读取）、Profile（统计） |
| `florence:demo-reviews` | Demo 模式评价数组（JSON） | AddReview（创建）、MyReviews（读取）、AllReviews（合并） |
| `florence:demo-user-id` | Demo 用户唯一 ID | dataService.ts 内部生成 |
| `florence:welcome-shown` | 引导页是否已展示 | App.tsx（判断是否跳转 Welcome） |

---

*文档版本: 1.0*
*生成时间: 2026-05-10*
*项目: Florence Student — UI 设计稿功能规格说明*
