# Florence Student — 功能架构设计稿

> **项目名称**: Florence Student（佛罗伦萨学生）
> **目标平台**: 响应式 Web 应用（H5 / PWA）
> **目标用户**: 佛罗伦萨大学（UNIFI）学生
> **界面语言**: 意大利语（正文）+ 英文（课程编码）
> **核心功能**: 课程搜索与评价、教授信息浏览、学习资源共享、选课决策辅助

---

## 一、技术架构总览

### 1.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | React 19 + TypeScript | 组件化开发，类型安全 |
| 构建工具 | Vite 6 | 快速 HMR 开发体验 |
| 路由 | React Router DOM v7 | History API 路由，支持动态参数 |
| 样式 | Tailwind CSS v4（CSS-first 配置） | 通过 `@theme` 内联变量实现主题 |
| 动画 | Framer Motion | 页面切换过渡、卡片交互动画 |
| 后端 | Supabase | PostgreSQL + Auth + Storage（BaaS） |
| 状态管理 | React local state + localStorage | 无外部状态库，各组件自行管理 |
| 图标 | Google Material Symbols Outlined | 线性图标风格 |
| 字体 | Kalam（手写标题） + 系统字体（正文） | Google Fonts |

### 1.2 文件结构

```
src/
├── main.tsx                  # Vite 入口，渲染 App
├── App.tsx                   # 根组件：BrowserRouter + 路由配置 + 页面动画
├── index.css                 # 全局样式 + CSS 变量（Tailwind v4 @theme）
├── vite-env.d.ts             # Vite 类型声明
├── pages/                    # 17 个页面组件（路由终点）
│   ├── Home.tsx             # 首页
│   ├── Courses.tsx          # 课程列表
│   ├── CourseDetail.tsx     # 课程详情
│   ├── Professors.tsx       # 教授目录
│   ├── ProfessorDetail.tsx  # 教授详情
│   ├── Login.tsx            # 登录 / 注册
│   ├── AuthCallback.tsx     # OAuth 回调处理
│   ├── Welcome.tsx          # 欢迎引导页（首次访问轮播）
│   ├── Profile.tsx          # 个人主页
│   ├── MyReviews.tsx        # 我的评价
│   ├── MyCourses.tsx        # 收藏课程
│   ├── AddReview.tsx        # 发布评价表单
│   ├── AllReviews.tsx       # 全站评价流
│   ├── Settings.tsx         # 设置页
│   ├── Notifications.tsx    # 通知中心
│   ├── Materials.tsx        # 资源中心 / 资料库
│   ├── ProgramDetail.tsx    # 专业详情
│   └── About.tsx            # 关于我们
├── components/               # 共享组件
│   ├── Layout.tsx           # 主布局容器（TopNav + BottomNav + main）
│   ├── TopNav.tsx           # 顶部导航栏（桌面端水平导航 / 移动端返回按钮）
│   ├── BottomNav.tsx        # 底部 Tab 栏（4 个 Tab）
│   ├── SearchBar.tsx        # 搜索输入框（带动画聚焦态）
│   ├── CourseCard.tsx       # 课程卡片（展示式卡片组件）
│   ├── ProfessorRow.tsx     # 教授列表行
│   ├── ReviewCard.tsx       # 评价卡片（含评分、提示区、Helpful 计数器）
│   ├── StarRatingDisplay.tsx # 只读星级评分展示
│   ├── StarRatingInput.tsx  # 交互式星级评分输入
│   ├── StatCard.tsx         # 统计数字卡片（支持独立旋转角度 + 胶带装饰）
│   ├── EmptyState.tsx       # 空状态占位（含图钉装饰）
│   └── Pushpin.tsx          # SVG 图钉装饰组件
├── lib/
│   ├── supabase.ts          # Supabase 客户端单例（PKCE 认证流程）
│   └── dataService.ts       # 所有数据获取函数的集合（Supabase + localStorage 双源）
└── data/
    └── mockData.ts          # 静态模拟数据（开发 / demo 模式使用）
```

### 1.3 环境配置

项目依赖以下环境变量（`.env`）：

| 变量名 | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名访问密钥（anon key） |
| `VITE_GEMINI_API_KEY` | Gemini AI API Key（当前项目中未实际使用） |
| `VITE_APP_URL` | 应用部署 URL |

---

## 二、路由架构

### 2.1 路由总表

| 路由路径 | 页面组件 | 说明 |
|---------|---------|------|
| `/welcome` | `Welcome` | 首次访问引导轮播（5 页） |
| `/` | `Home` | 首页 |
| `/courses` | `Courses` | 课程搜索与列表 |
| `/courses/:id` | `CourseDetail` | 课程详情（含评分看板、评价、资料） |
| `/courses/:id/review` | `AddReview` | 为指定课程发布评价 |
| `/professors` | `Professors` | 教授目录 |
| `/professors/:id` | `ProfessorDetail` | 教授详情（含个人信息、课程、评价） |
| `/login` | `Login` | 登录 / 注册页 |
| `/auth/callback` | `AuthCallback` | OAuth 回调处理页 |
| `/profile` | `Profile` | 个人主页 |
| `/profile/reviews` | `MyReviews` | 我的评价列表 |
| `/profile/courses` | `MyCourses` | 收藏课程列表 |
| `/profile/edit` | `Profile` | 编辑个人资料（同 Profile 组件） |
| `/profile/favorites` | `MyCourses` | 收藏课程（同 MyCourses 组件） |
| `/settings` | `Settings` | 设置页 |
| `/notifications` | `Notifications` | 通知中心 |
| `/programs/:code` | `ProgramDetail` | 专业详情（按专业代码） |
| `/reviews` | `AllReviews` | 全站评价流 |
| `/materials` | `Materials` | 资源中心 |
| `/resources` | `Materials` | 资源中心（别名路由） |
| `/about` | `About` | 关于页面 |

### 2.2 页面动画

所有路由页面使用 Framer Motion 统一过渡动画：

- **进场**: `opacity: 0→1` + `y: 16→0`，持续 400ms，使用 `[0.22, 1, 0.36, 1]` 缓动曲线
- **退场**: `opacity: 1→0` + `y: 0→-12`，持续 250ms，使用 `[0.55, 0, 1, 0.45]` 缓动曲线
- 动画模式为 `AnimatePresence mode="wait"`，等待旧页面退出后新页面进场

---

## 三、数据模型

### 3.1 核心实体

```
User (Supabase Auth)
  └── Profile (profiles 表)
        ├── id: UUID (PK, 关联 auth.users)
        ├── username: TEXT
        ├── faculty: TEXT
        ├── enrollment_year: INTEGER
        ├── avatar_url: TEXT
        └── created_at: TIMESTAMPTZ

Professor (professors 表)
  ├── id: UUID (PK)
  ├── name: TEXT
  ├── department: TEXT
  ├── faculty: TEXT
  ├── bio: TEXT
  ├── email: TEXT
  ├── office: TEXT
  └── created_at: TIMESTAMPTZ

Program (专业/学位项目)
  ├── code: TEXT (PK, 如 "LM-92")
  ├── name: TEXT
  ├── faculty: TEXT (所属学院)
  ├── totalCredits: INTEGER
  ├── description: TEXT
  ├── president: TEXT (专业负责人)
  ├── courseCount: INTEGER
  └── requiredCount: INTEGER (必修课数量)

Course (courses 表)
  ├── id: UUID (PK)
  ├── name: TEXT
  ├── faculty: TEXT
  ├── credits: INTEGER (CFU 学分)
  ├── description: TEXT
  ├── semester: TEXT (Annuale / I Semestre / II Semestre)
  ├── is_required: BOOLEAN
  ├── year_level: INTEGER
  ├── program_code: TEXT
  └── created_at: TIMESTAMPTZ

CourseProfessor (course_professor 表，关联表)
  ├── course_id: UUID (FK → courses)
  └── professor_id: UUID (FK → professors)

Review (reviews 表)
  ├── id: UUID (PK)
  ├── user_id: UUID (FK → profiles)
  ├── course_id: UUID (FK → courses)
  ├── professor_id: UUID (FK → professors, nullable)
  ├── difficulty_score: INTEGER (1-5)
  ├── grading_score: INTEGER (1-5)
  ├── teaching_score: INTEGER (1-5)
  ├── verbal_review: TEXT
  ├── exam_tips: TEXT (考试技巧，选填)
  ├── is_anonymous: BOOLEAN
  ├── helpful_count: INTEGER
  └── created_at: TIMESTAMPTZ

Resource (resources 表)
  ├── id: UUID (PK)
  ├── course_id: UUID (FK → courses)
  ├── uploader_id: UUID (FK → profiles)
  ├── title: TEXT
  ├── type: TEXT (pdf / audio / video / doc / image)
  ├── file_url: TEXT
  ├── file_size: INTEGER (字节)
  ├── download_count: INTEGER
  └── created_at: TIMESTAMPTZ

UserFavorite (user_favorites 表)
  ├── id: UUID (PK)
  ├── user_id: UUID (FK → profiles)
  ├── course_id: UUID (FK → courses)
  └── created_at: TIMESTAMPTZ
```

### 3.2 应用层数据结构（TypeScript Interfaces）

以下接口定义在 `dataService.ts` 中，是 Supabase 数据到应用层的映射：

```typescript
interface Course {
  id: string;
  name: string;
  professorId: string;
  professorName: string;
  credits: number;
  semester: string;
  yearLevel: number;
  isRequired: boolean;
  programCode: string;
  description: string;
  faculty: string;
  rating?: number;       // 综合评分（3 维平均）
  reviewCount?: number;
  difficulty?: number;    // 难度评分（1-5）
  teaching?: number;      // 讲课质量（1-5）
  grading?: number;       // 给分质量（1-5）
}

interface Professor {
  id: string;
  name: string;
  department: string;
  faculty: string;
  bio?: string;
  email?: string;
  office?: string;
  rating: number;
  programs: string[];     // 所属专业代码数组
  courseCount: number;
}

interface Review {
  id: string;
  courseId: string;
  author: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  tip?: string;
  tipType?: 'success' | 'warning';
  helpfulCount: number;
}

interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: 'pdf' | 'audio' | 'video' | 'doc' | 'image';
  uploader: string;
  date: string;
  size: string;
  downloads: number;
  description?: string;
}

interface Program {
  code: string;
  name: string;
  faculty: string;
  totalCredits: number;
  description: string;
  president: string;
  courseCount: number;
  requiredCount: number;
}
```

---

## 四、数据服务层（dataService.ts）

### 4.1 双数据源架构

整个应用采用 **Supabase + localStorage** 双源策略，`dataService.ts` 是唯一的数据入口：

```
应用层 (页面组件)
       ↓ useEffect 调用
dataService.ts（统一接口）
       ↓
┌─────────────────────┬─────────────────────┐
│   Supabase（BaaS）   │   localStorage（Demo）│
│  认证用户数据         │  未登录时的离线演示数据 │
└─────────────────────┴─────────────────────┘
```

**设计原则**：

- 优先尝试 Supabase 查询，失败时降级到 localStorage
- 评论数据：Supabase（已登录）+ localStorage（未登录/Demo 模式）合并展示
- 收藏数据：始终写入 localStorage（`florence:saved-course-ids`）
- Supabase 和 localStorage 中的同一评论通过 `id` 去重

### 4.2 核心数据函数

#### 课程相关

| 函数 | 说明 |
|------|------|
| `fetchCourses()` | 获取所有课程，合并 Supabase 评价数据计算平均评分 |
| `fetchCourseById(id)` | 按 ID 获取单个课程详情 |
| `fetchCoursesByProfessor(professorId)` | 获取某教授的所有授课课程 |
| `fetchCoursesByProgram(programCode)` | 获取某专业的所有课程 |

#### 教授相关

| 函数 | 说明 |
|------|------|
| `fetchProfessors()` | 获取所有教授，附带其所属专业代码 |
| `fetchProfessorById(id)` | 按 ID 获取教授详情 |

#### 评价相关

| 函数 | 说明 |
|------|------|
| `fetchReviewsByCourse(courseId)` | 获取某课程的所有评价（合并 demo 数据） |
| `fetchReviewsByProfessor(professorId)` | 获取某教授收到的所有评价（合并 demo 数据） |
| `fetchAllReviews()` | 获取全站所有评价（合并 demo 数据，按时间倒序） |
| `fetchUserReviews()` | 获取当前用户的评价（已登录查 Supabase，未登录查 localStorage） |
| `createReview(params)` | 创建评价（已登录写 Supabase，未登录写 localStorage） |
| `deleteDemoReview(reviewId)` | 删除本地 Demo 评价 |

**评分计算规则**（`fetchCourses` 中）：

- 课程综合评分 = (难度总和 + 给分总和 + 讲课总和) / (评价数量 × 3)，保留 1 位小数
- 各维度平均分独立计算

#### 收藏相关（localStorage）

| 函数 | 说明 |
|------|------|
| `getSavedCourseIds()` | 读取所有已收藏课程 ID |
| `isCourseSaved(courseId)` | 判断某课程是否已收藏 |
| `saveCourse(courseId)` | 添加收藏 |
| `unsaveCourse(courseId)` | 取消收藏 |
| `toggleSaveCourse(courseId)` | 切换收藏状态，返回新的收藏状态（boolean） |

localStorage Key：`florence:saved-course-ids`（JSON 数组）

#### Demo 模式相关

| 函数 | 说明 |
|------|------|
| `getDemoUserId()` | 获取或生成 Demo 用户 ID（Key：`florence:demo-user-id`） |
| `getDemoReviews()` | 读取本地 Demo 评价 |
| `persistDemoReviews(reviews)` | 持久化 Demo 评价到 localStorage（Key：`florence:demo-reviews`） |

#### 工具函数

| 函数 | 说明 |
|------|------|
| `getProfessorInitials(name)` | 从教授姓名提取首字母缩写（去除 "Prof." 前缀） |

### 4.3 发布评价流程

```
用户填写表单（AddReview 组件）
        ↓ 验证（内容 ≥ 20 字符）
createReview(params)
        ↓
检查 supabase.auth.getSession()
        ├─ 已登录 → 写入 Supabase reviews 表
        └─ 未登录 → 写入 localStorage florence:demo-reviews
        ↓
返回 { success: boolean, error?: string }
```

### 4.4 评分标签映射

| 分值 | Difficoltà（难度） | Voto（给分） | Docenza（讲课） |
|------|-------------------|-------------|----------------|
| 1 | Molto facile | Pessimo | Pessima |
| 2 | Facile | Scarso | Scarso |
| 3 | Medio | Normale | Normale |
| 4 | Difficile | Buono | Buona |
| 5 | Molto difficile | Eccellente | Eccellente |

---

## 五、认证系统

### 5.1 认证方式

| 方式 | 实现 | 说明 |
|------|------|------|
| Google OAuth | Supabase Auth PKCE 流程 | 主要登录方式，通过 `/auth/callback` 处理回调 |
| 邮箱 / 密码 | Supabase Auth | 支持注册、登录、密码重置 |
| Demo 模式 | localStorage | 无需认证，应用完整可用 |

### 5.2 Supabase Auth 配置

```typescript
createClient(url, key, {
  auth: {
    autoRefreshToken: true,     // 自动刷新 Token
    detectSessionInUrl: true,   // 从 URL 检测 OAuth 回调
    flowType: 'pkce',           // PKCE 安全流程
    persistSession: true,       // Session 持久化到 localStorage
  }
});
```

### 5.3 认证状态的使用

- `supabase.auth.getSession()` 用于判断当前用户是否已登录
- 已登录用户可发布评价、收藏课程、管理个人信息
- 未登录用户使用 Demo 模式，数据存在 localStorage 中
- 登录状态变更通过 Supabase 实时监听（`supabase.auth.onAuthStateChange`）

---

## 六、功能模块详解

### 6.1 首页（Home）

**核心功能**：

- 欢迎语区：显示用户称呼 + 问候语
- 搜索栏：点击后跳转至 `/courses`
- 快捷统计：课程总数 + 全站平均评分
- 收藏课程统计：点击跳转 `/profile/courses`
- 教授浏览入口：显示教授总数，点击跳转 `/professors`
- 专业课程分组列表：按专业折叠展示课程
- 课程卡片点击进入课程详情

**数据来源**：

- `fetchCourses()` → 课程列表和统计数据
- `getSavedCourseIds()` → 收藏数量
- `fetchProfessors()` → 教授数量

### 6.2 课程系统

**课程列表（`/courses`）**：

- 搜索：按课程名称过滤
- 筛选：按学年（Anno 1 / 2 / 3）、学期、必修/选修、专业
- 列表展示：`CourseCard` 组件

**课程详情（`/courses/:id`）**：

- 顶部信息区：专业代码、课程名、标签（必修/选修、学期、学分）
- 三维评分看板：难度 / 给分 / 讲课，分别显示平均值和星级
- 课程描述：可折叠，超过 3 行显示"更多"
- 授课教授卡片：点击跳转教授详情
- Tab 切换：评价（Recensioni）| 资料（Materiali）
- 收藏按钮：右上角心形，localStorage 持久化
- 底部悬浮按钮（FAB）：写评价

**发布评价（`/courses/:id/review`）**：

- 三维评分输入：各维度 5 星选择器，标签随分值变化
- 体验描述：textarea，最少 20 字符
- 考试技巧（选填）：便签纸样式
- 匿名开关：Toggle 控制，关闭时显示真实用户名
- 取消 / 发送：导航栏两侧按钮

**数据来源**：`fetchCourseById(id)` + `fetchReviewsByCourse(id)` + `fetchResourcesByCourse(id)`

### 6.3 教授系统

**教授列表（`/professors`）**：

- 搜索：按教授姓名过滤
- 筛选：按学院（Faculty）横向滚动筛选条
- 列表展示：`ProfessorRow` 组件（头像、姓名、院系、专业代码）

**教授详情（`/professors/:id`）**：

- 个人信息：头像、姓名、院系、学院
- 个人简介（bio）：便签纸样式展示
- 授课课程列表：关联的课程列表
- 教授收到的评价：关联的评价

**数据来源**：`fetchProfessorById(id)` + `fetchCoursesByProfessor(id)` + `fetchReviewsByProfessor(id)`

### 6.4 专业系统

**专业详情（`/programs/:code`）**：

- 头部信息：专业代码、名称、学院、负责人
- 统计条：课程总数 / 必修课数 / 总学分
- 信息列表：学院、学分、负责人（便签纸样式行）
- 课程分类列表：必修课（Obbligatori）+ 选修课（A scelta）
- 教授列表：显示前 3 个，"查看全部"弹窗

**数据来源**：本地的 `programs` 数组 + `fetchCoursesByProgram(code)`

**内置专业（5 个）**：

| 代码 | 名称 | 类型 | 学院 |
|------|------|------|------|
| LM-92 | Pratiche, linguaggi e culture della comunicazione | 硕士 LM | Scuola di Studi Umanistici |
| LM-14 | Filologia moderna | 硕士 LM | Scuola di Studi Umanistici |
| LM-2 | Archeologia | 硕士 LM | Scuola di Scienze Politiche |
| L-11 | Lingue, letterature e studi interculturali | 本科 L | Scuola di Studi Umanistici |
| L-10 | Lettere | 本科 L | Scuola di Studi Umanistici |

### 6.5 评价系统

**全站评价流（`/reviews`）**：

- 按时间倒序展示所有评价
- 显示每条评价的课程名、作者、日期、三维评分、内容

**我的评价（`/profile/reviews`）**：

- 当前用户的评价列表
- 每条评价有编辑和删除按钮
- 删除需二次确认（Alert 弹窗）

**数据来源**：`fetchUserReviews()` → 合并 demo + Supabase 的用户评价

### 6.6 资源中心

**资料列表（`/materials`）**：

- 搜索：按资料标题过滤
- 筛选：按类型（Tutti / Dispense / Esercizi / Esami / Appunti / Audio）横向滚动
- 资料卡片：图标、标题、类型标签、上传者、日期、大小、下载次数
- 右下角 FAB：上传资料按钮（已登录用户可见）
- 点击弹出详情 Modal：显示完整信息 + 下载按钮

**数据来源**：目前使用 `mockData.ts` 中的静态 `resources` 数组

### 6.7 个人中心

**用户主页（`/profile`）**：

- 用户信息卡片：头像（蓝白渐变）、用户名、邮箱、学院、入学年份
- 统计区：收藏课程数 / 评价数 / 资料数（3 张独立旋转的卡片）
- 我的评价区块：最近 2 条，含空状态
- 收藏课程区块：最近 2 门，含空状态
- 设置列表：通知、隐私、反馈帮助、关于
- 退出登录：红色文字，Alert 确认

**编辑资料（`/profile/edit`）**：

- Bottom Sheet 弹出层
- 可编辑字段：用户名、院系（10 所学院下拉选择）、入学年份（2015-2025）
- 底部保存按钮

### 6.8 设置与通知

**设置页（`/settings`）**：

- 通知开关（Toggle）
- 匿名评价开关（Toggle）
- 各功能入口链接：通知、隐私、反馈、帮助
- 版本号显示
- 退出登录（红色）

**通知中心（`/notifications`）**：

- 静态通知列表（4 条示例）
- 每条含彩色图标、标题、内容、时间
- 支持已读 / 未读状态

**数据来源**：`mockData.ts` 中的静态通知数据

### 6.9 欢迎引导页

**路由**：`/welcome`

- 5 页横向轮播（Framer Motion PageView）
- 每页：品牌图标 + 手写体标题 + 副标题
- 底部 CTA："Inizia ora"（主按钮）+ "Accedi / Registrati"（次按钮）
- localStorage 标记已看过，首次访问后不再显示

### 6.10 关于页面

- 展示应用名称、版本号、功能介绍、联系方式
- 便签纸旋转装饰效果

---

## 七、页面状态设计

### 7.1 加载状态

| 场景 | 处理方式 |
|------|---------|
| 页面初始加载 | React `useState` 初始化为空数组，useEffect 调用 dataService，异步返回后更新状态 |
| 按钮提交中 | 按钮内嵌 spinner + `disabled` 属性 |
| TypeScript 类型安全 | 所有 dataService 函数标注返回类型，Supabase 错误统一打印并返回空数组 |

### 7.2 空数据状态

| 场景 | 显示 |
|------|------|
| 课程搜索无结果 | EmptyState 组件（便签纸样式） |
| 课程无评价 | EmptyState："Nessuna recensione" |
| 课程无资料 | EmptyState："Nessun materiale" |
| 用户无评价 | EmptyState："Nessuna recensione" |
| 用户无收藏 | EmptyState："Nessun preferito" |
| 无通知 | EmptyState："Nessuna notifica" |

### 7.3 错误状态

| 场景 | 处理 |
|------|------|
| 表单验证失败 | 输入框下方红色小字提示 |
| Supabase 查询失败 | `console.error` 打印，返回空数组，页面展示空状态 |
| 发布评价失败 | 返回 `{ success: false, error: '...' }`，页面显示错误提示 |

### 7.4 成功反馈

| 操作 | 反馈 |
|------|------|
| 发布评价成功 | Toast 提示 + 自动跳转回课程详情 |
| 收藏 / 取消收藏 | 心形图标弹跳动画（scale 动画） |
| 登录成功 | 跳转首页 |

---

## 八、组件清单

### 8.1 布局组件

| 组件 | 文件 | 说明 |
|------|------|------|
| `Layout` | `Layout.tsx` | 主布局：TopNav + BottomNav + main content area |
| `TopNav` | `TopNav.tsx` | 顶部导航：Logo 居中 + 桌面端横向链接 + 移动端返回按钮 |
| `BottomNav` | `BottomNav.tsx` | 底部 Tab 栏：4 个 Tab（Home / Cerca / Materiali / Profilo） |

### 8.2 通用 UI 组件

| 组件 | 文件 | 说明 |
|------|------|------|
| `SearchBar` | `SearchBar.tsx` | 搜索输入框，支持聚焦动画 |
| `CourseCard` | `CourseCard.tsx` | 课程卡片（点击进入详情，含评分、标签） |
| `ProfessorRow` | `ProfessorRow.tsx` | 教授行（头像、姓名、院系、专业代码） |
| `ReviewCard` | `ReviewCard.tsx` | 评价卡片（三维评分、提示区、Helpful 计数器） |
| `StarRatingDisplay` | `StarRatingDisplay.tsx` | 只读 5 星展示 |
| `StarRatingInput` | `StarRatingInput.tsx` | 交互式 5 星输入（带标签文字变化） |
| `StatCard` | `StatCard.tsx` | 统计卡片（数值 + 图标 + 标签，支持旋转 + 胶带装饰） |
| `EmptyState` | `EmptyState.tsx` | 空状态占位（图钉装饰） |
| `Pushpin` | `Pushpin.tsx` | SVG 图钉装饰 |

---

## 九、Supabase 数据库表（生产环境）

### 9.1 表结构

```sql
-- 用户资料
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  faculty TEXT,
  enrollment_year INTEGER,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 教授
CREATE TABLE professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT,
  faculty TEXT,
  bio TEXT,
  email TEXT,
  office TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 专业
CREATE TABLE programs (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  faculty TEXT,
  total_credits INTEGER,
  description TEXT,
  president TEXT,
  curriculum TEXT,
  website_url TEXT
);

-- 课程
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  faculty TEXT,
  credits INTEGER DEFAULT 0,
  description TEXT,
  semester TEXT,
  is_required BOOLEAN DEFAULT false,
  year_level INTEGER DEFAULT 1,
  program_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 课程-教授关联表
CREATE TABLE course_professor (
  course_id UUID REFERENCES courses(id),
  professor_id UUID REFERENCES professors(id),
  semester TEXT,
  PRIMARY KEY (course_id, professor_id)
);

-- 评价
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  professor_id UUID REFERENCES professors(id),
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 5),
  grading_score INTEGER CHECK (grading_score BETWEEN 1 AND 5),
  teaching_score INTEGER CHECK (teaching_score BETWEEN 1 AND 5),
  verbal_review TEXT,
  exam_tips TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 资源
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  uploader_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  type TEXT,
  file_url TEXT,
  file_size INTEGER,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 收藏
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id UUID REFERENCES courses(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, course_id)
);
```

### 9.2 RLS 策略（行级安全）

| 表 | 策略 |
|----|------|
| `profiles` | 所有人可读，登录用户可更新自己的行 |
| `courses` | 公开可读 |
| `professors` | 公开可读 |
| `programs` | 公开可读 |
| `reviews` | 公开可读，登录用户可插入，插入者只能修改/删除自己的行 |
| `resources` | 公开可读，登录用户可插入，插入者可删除自己的行 |
| `user_favorites` | 登录用户可读写自己的收藏记录 |

---

## 十、业务规则汇总

### 10.1 课程评分计算

- 综合评分 = (难度 + 给分 + 讲课) 各维度平均后，再平均所有维度
- 仅当存在至少 1 条评价时才计算和显示评分
- Demo 评价和 Supabase 评价合并计算

### 10.2 评价发布规则

- 登录用户：写入 Supabase `reviews` 表，`author` 取自 `profiles.username`
- 未登录用户（Demo）：写入 localStorage，author 固定为 "Tu"（或 "Studente anonimo"）
- 内容最少 20 字符
- 考试技巧为选填
- 匿名评价时，`is_anonymous = true`，显示 "Studente anonimo"

### 10.3 收藏课程

- 纯 localStorage 实现，不依赖 Supabase
- 同一课程 ID 不会重复保存
- `toggleSaveCourse` 返回新的收藏状态（boolean）

### 10.4 欢迎引导

- localStorage Key：`florence:welcome-shown`（boolean）
- 首次访问或未设置时显示 `/welcome`
- 已看过则直接进入 `/`

---

## 十一、NPM Scripts

| 命令 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 3000，监听所有网卡） |
| `npm run build` | 生产构建，输出到 `dist/` |
| `npm run preview` | 预览生产构建产物 |
| `npm run clean` | 删除 `dist/` 目录 |
| `npm run lint` | TypeScript 类型检查（`tsc --noEmit`） |

---

*文档版本: 1.0*
*生成时间: 2026-05-10*
*项目: Florence Student — 佛罗伦萨大学课程评价平台*
