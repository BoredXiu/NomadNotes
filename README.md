# NomadNotes (游迹)

极简旅行记录全栈应用，支持旅程管理、消费记账、游记编写及图片矢量化。
用户为每次旅程管理 **账单** 与 **游记**，旅程结束后自动生成消费统计与时间线回顾。

## 技术栈

| 层级     | 技术                                           |
| -------- | ---------------------------------------------- |
| 前端     | React 18 + TypeScript + Vite                   |
| UI       | Ant Design 5                                   |
| 状态管理 | Zustand（客户端）+ TanStack Query（服务端）    |
| 路由     | React Router v6 (history 模式)                 |
| 图表     | Recharts                                       |
| HTTP     | Axios                                          |
| PDF 导出 | html2pdf.js                                    |
| 后端     | Node.js 20+ (ESM) + Express                    |
| 数据库   | MySQL 8.0                                      |
| ORM      | Sequelize v6                                   |
| 认证     | JWT 双 token (access + refresh) + bcrypt       |
| 文件上传 | Multer                                         |
| 验证码   | svg-captcha                                    |
| 安全     | helmet、compression、express-rate-limit        |
| 部署     | 前端 Vercel / Netlify，后端 Railway / 云服务器 |

## 功能特性

- **旅程管理**：创建、编辑、删除旅程，支持公开/私密切换、结束旅程
- **消费记账**：按分类记录消费，支持多货币自动转换与小票图片上传
- **游记编写**：撰写旅行见闻，上传图片自动矢量化
- **图片矢量化**：使用 SVG 转换将游记图片转换为矢量图
- **数据统计**：消费分类统计、每日消费趋势、游记统计，统计支持多币种切换
- **多币种支持**：CNY、USD、EUR、GBP、JPY、AUD 等货币，金额输入与统计可切换并自动转换
- **游记导出**：HTML、Markdown、PDF 三种格式导出完整旅程报告（概览 + 账单 + 统计 + 游记）
- **全局搜索**：跨旅程的标题、目的地、账单、游记、分类标签搜索
- **探索发现**：浏览公开旅程（微游记）
- **图形验证码**：登录/注册接入图形验证码
- **滑板导航**：定制滑板样式 Tab 切换动画

## 目录结构

```
nomadnotes/
├── client/                                # React 前端
│   ├── public/
│   ├── src/
│   │   ├── api/                           # Axios 实例与请求函数
│   │   │   ├── client.ts                  # Axios 实例
│   │   │   ├── auth.ts                    # 认证
│   │   │   ├── trips.ts                   # 旅程
│   │   │   ├── expenses.ts                # 账单
│   │   │   ├── notes.ts                   # 游记
│   │   │   ├── export.ts                  # 游记导出
│   │   │   ├── upload.ts                  # 文件上传
│   │   │   ├── search.ts                  # 全局搜索
│   │   │   ├── currency.ts                # 多币种汇率
│   │   │   ├── profile.ts                 # 用户资料
│   │   │   └── geocode.ts                 # 地理编码
│   │   ├── components/                    # 公共组件
│   │   │   ├── AppLayout.tsx              # 主布局
│   │   │   ├── CurrencySwitcher.tsx       # 货币切换器
│   │   │   ├── ExportModal.tsx            # 导出弹窗
│   │   │   ├── SearchBar.tsx              # 全局搜索
│   │   │   ├── SkateboardNav.tsx          # 滑板导航
│   │   │   ├── SkateboardTabBar.tsx       # 滑板 Tab
│   │   │   ├── NomadIcons.tsx             # 自定义 SVG 图标
│   │   │   └── Skeletons.tsx              # 骨架屏
│   │   ├── pages/                         # 页面组件
│   │   │   ├── HomePage.tsx               # 首页（旅程列表）
│   │   │   ├── TripDetailPage.tsx         # 旅程详情（账单/游记/统计/概览）
│   │   │   ├── TripFormPage.tsx           # 旅程表单
│   │   │   ├── ExpenseFormPage.tsx        # 账单表单（多币种）
│   │   │   ├── NoteFormPage.tsx           # 游记表单
│   │   │   ├── NoteDetailPage.tsx         # 游记详情
│   │   │   ├── ExplorePage.tsx            # 探索发现
│   │   │   ├── SearchResultsPage.tsx      # 搜索结果
│   │   │   ├── LoginPage.tsx              # 登录（图形验证码）
│   │   │   ├── RegisterPage.tsx           # 注册（图形验证码）
│   │   │   ├── ProfileEditPage.tsx        # 个人资料编辑
│   │   │   └── PublicTripDetailPage.tsx   # 公开旅程详情
│   │   ├── store/                         # Zustand 状态
│   │   │   ├── authStore.ts               # 认证
│   │   │   ├── themeStore.ts              # 主题
│   │   │   └── currencyStore.ts           # 多币种 + 自动转换
│   │   ├── types/                         # TS 类型定义
│   │   ├── utils/                         # 工具方法
│   │   │   └── compress.ts                # 客户端图片压缩
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                               # VITE_API_BASE_URL
│   └── package.json
└── server/                                # Node.js 后端 (ESM)
    ├── src/
    │   ├── config/                        # 数据库配置
    │   ├── controllers/                   # 控制器
    │   │   ├── authController.js
    │   │   ├── captchaController.js       # 图形验证码
    │   │   ├── currencyController.js      # 汇率
    │   │   ├── expenseController.js
    │   │   ├── exportController.js        # 游记导出
    │   │   ├── geocodeController.js
    │   │   ├── noteController.js
    │   │   ├── profileController.js
    │   │   ├── searchController.js        # 全局搜索
    │   │   ├── tripController.js
    │   │   └── uploadController.js
    │   ├── middleware/                    # auth, upload, errorHandler, validateTimeRange
    │   ├── models/                        # Sequelize 模型
    │   │   ├── User.js
    │   │   ├── Trip.js
    │   │   ├── Expense.js
    │   │   └── Note.js
    │   ├── routes/                        # 路由
    │   ├── services/                      # 业务逻辑
    │   │   ├── cleanupScheduler.js        # 临时文件清理
    │   │   ├── tripStatusScheduler.js     # 旅程状态自动结束
    │   │   └── exportService.js           # 导出（HTML/Markdown/PDF 基础内容）
    │   ├── utils/                         # AppError, jwt 工具
    │   └── app.js                         # Express 配置
    ├── uploads/
    │   ├── images/                        # 永久存储图片
    │   ├── vectors/                       # SVG 矢量图
    │   └── tmp/                           # 临时文件
    │       ├── images/
    │       └── vectors/
    ├── .env                               # 环境变量
    └── package.json
```

## 快速开始

### 前置要求

- Node.js 20+
- MySQL 8.0
- npm

### 1. 克隆项目

```bash
git clone <repository-url>
cd NomadNotes
```

### 2. 数据库配置

创建 MySQL 数据库：

```sql
CREATE DATABASE nomadnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 后端配置

```bash
cd server
npm install
```

创建 `server/.env` 文件：

```env
PORT=3434
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nomadnotes
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

启动后端：

```bash
npm run dev
```

> 首次启动会自动创建数据库表。

### 4. 前端配置

```bash
cd client
npm install
```

创建 `client/.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3434
```

启动前端：

```bash
npm run dev
```

访问 `http://localhost:5173`。

## API 规范

- **前缀**: `/api`
- **认证**: `Authorization: Bearer <accessToken>`
- **统一响应格式**:

```json
{
  "success": true | false,
  "data": {} | [],
  "message": "错误或提示信息",
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

### 核心路由

#### 认证

| 方法 | 路径               | 说明                 |
| ---- | ------------------ | -------------------- |
| POST | /api/auth/register | 注册（含图形验证码） |
| POST | /api/auth/login    | 登录（含图形验证码） |
| POST | /api/auth/refresh  | 刷新令牌             |
| GET  | /api/auth/captcha  | 获取图形验证码       |

#### 旅程

| 方法   | 路径           | 说明     |
| ------ | -------------- | -------- |
| POST   | /api/trips     | 创建旅程 |
| GET    | /api/trips     | 旅程列表 |
| GET    | /api/trips/:id | 旅程详情 |
| PATCH  | /api/trips/:id | 更新旅程 |
| DELETE | /api/trips/:id | 删除旅程 |

#### 账单

| 方法   | 路径                              | 说明     |
| ------ | --------------------------------- | -------- |
| POST   | /api/trips/:tripId/expenses       | 创建账单 |
| GET    | /api/trips/:tripId/expenses       | 账单列表 |
| GET    | /api/trips/:tripId/expenses/stats | 账单统计 |
| PATCH  | /api/expenses/:id                 | 更新账单 |
| DELETE | /api/expenses/:id                 | 删除账单 |

#### 游记

| 方法   | 路径                     | 说明     |
| ------ | ------------------------ | -------- |
| POST   | /api/trips/:tripId/notes | 创建游记 |
| GET    | /api/trips/:tripId/notes | 游记列表 |
| GET    | /api/notes/:id           | 游记详情 |
| PATCH  | /api/notes/:id           | 更新游记 |
| DELETE | /api/notes/:id           | 删除游记 |

#### 游记导出

| 方法 | 路径              | 说明                                                       |
| ---- | ----------------- | ---------------------------------------------------------- |
| POST | /api/notes/export | 导出旅程报告（HTML/Markdown；PDF 由前端 html2pdf.js 转换） |

#### 文件上传

| 方法 | 路径                         | 说明           |
| ---- | ---------------------------- | -------------- |
| POST | /api/upload                  | 单文件临时上传 |
| POST | /api/upload/tmp              | 多文件临时上传 |
| POST | /api/upload/persist          | 持久化多文件   |
| POST | /api/upload/persist-single   | 持久化单文件   |
| POST | /api/upload/persist-multiple | 持久化多文件   |

#### 全局搜索

| 方法 | 路径        | 说明                                     |
| ---- | ----------- | ---------------------------------------- |
| GET  | /api/search | 跨旅程搜索（标题/目的地/账单/游记/分类） |

#### 汇率

| 方法 | 路径                | 说明         |
| ---- | ------------------- | ------------ |
| GET  | /api/currency/rates | 获取最新汇率 |

#### 地理编码

| 方法 | 路径         | 说明         |
| ---- | ------------ | ------------ |
| GET  | /api/geocode | 地址地理编码 |

#### 用户

| 方法  | 路径         | 说明             |
| ----- | ------------ | ---------------- |
| GET   | /api/profile | 获取当前用户资料 |
| PATCH | /api/profile | 更新个人资料     |

## 货币与汇率

- 默认币种：**CNY（人民币）**
- 支持币种：CNY、USD、EUR、GBP、JPY、AUD 等（前后端可扩展）
- 金额存储：所有账单均以原始货币与金额保存（`amount` + `currency`）
- 自动转换：客户端 `currencyStore` 缓存汇率；切换币种时通过 `convertAmount(amount, from, to)` 实时换算
- 汇率来源：后端 `/api/currency/rates`（可对接第三方汇率 API，本项目内置可降级数据）

## 图片处理

### 上传流程

1. **客户端压缩**：上传前通过 `utils/compress.ts`（基于 Canvas）将图片压缩为最长边 750px、JPEG 0.8 质量
2. **临时上传**：图片上传至 `uploads/tmp/images/`，并生成对应的 SVG 矢量图存放至 `uploads/tmp/vectors/`
3. **持久化**：表单提交时调用 `/api/upload/persist-single` 或 `/api/upload/persist-multiple` 将临时文件移至 `uploads/images/` 和 `uploads/vectors/`
4. **矢量化**：游记配图在持久化时同步生成 SVG 矢量图，存储于 `notes.vector_images`
5. **清理任务**：`cleanupScheduler` 定期清理过期的临时文件

### 图片替换

- 编辑账单时可更换小票图片，自动删除原文件
- 编辑游记时可更换配图，自动删除原图片和 SVG 文件

## 导出游记

通过 `ExportModal` 导出整个旅程的完整报告：

- **HTML / Markdown**：服务端 `exportService` 生成，图片转 base64 嵌入，文件不依赖外部资源
- **PDF**：前端 `html2pdf.js` 将 HTML 渲染为 PDF（解决后端直接生成 PDF 的字体/编码问题）
- **导出内容**：
  - 旅程概览（标题、目的地、日期、状态）
  - 账单汇总（总数、分类饼图、每日折线）
  - 账单明细表格
  - 游记列表（按日期排序，含配图、SVG 矢量图、文字内容）
- **导出范围**：支持导出全部游记或勾选指定游记

## 数据库设计

表之间通过字段名逻辑关联（如 `user_id`、`trip_id`），由应用层维护数据一致性，**不使用外键约束**。

- **users**: id (UUID), username, email, password_hash, avatar_url
- **trips**: id (UUID), user_id, title, destination, start_date, end_date, cover_image, is_ended, is_public
- **expenses**: id (UUID), trip_id, category, amount (DECIMAL), currency, note, receipt_image, expense_date
- **notes**: id (UUID), trip_id, content (TEXT), images (JSON), vector_images (JSON), note_date

## 开发命令

```bash
# 前端开发
cd client && npm install && npm run dev

# 前端构建
cd client && npm run build

# 后端开发（热重载）
cd server && npm install
npm install @realness.online/potrace  # 可选：游记图片转 SVG
npm run dev   # nodemon src/app.js

# 后端启动
cd server && npm start
```
