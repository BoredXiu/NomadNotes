# NomadNotes (游迹)

极简旅行记录全栈应用，支持旅程管理、消费记账、游记编写及图片矢量化。

## 技术栈

| 层级     | 技术                                           |
| -------- | ---------------------------------------------- |
| 前端     | React 18 + TypeScript + Vite                   |
| UI       | Ant Design 5                                   |
| 状态管理 | Zustand（客户端）+ TanStack Query（服务端）    |
| 路由     | React Router v6 (history 模式)                 |
| 图表     | Recharts                                       |
| HTTP     | Axios                                          |
| 后端     | Node.js 20+ (ESM) + Express                    |
| 数据库   | MySQL 8.0                                      |
| ORM      | Sequelize v7                                   |
| 认证     | JWT 双 token (access + refresh) + bcrypt       |
| 文件上传 | Multer                                         |
| 图片处理 | Jimp + Potrace（游记图片转 SVG）               |
| 部署     | 前端 Vercel / Netlify，后端 Railway / 云服务器 |

## 功能特性

- **旅程管理**：创建、编辑、删除旅程，支持公开/私密切换
- **消费记账**：按分类记录消费，支持小票图片上传
- **游记编写**：撰写旅行见闻，上传图片自动矢量化
- **图片矢量化**：使用 Potrace 将游记图片转换为 SVG 矢量图
- **数据统计**：消费分类统计、每日消费趋势、游记统计
- **探索发现**：浏览公开旅程

## 目录结构

```
nomadnotes/
├── client/                          # React 前端
│   ├── public/
│   ├── src/
│   │   ├── api/                     # Axios 实例与请求函数
│   │   ├── components/              # 公共组件
│   │   ├── hooks/                   # 自定义 Hook
│   │   ├── pages/                   # 页面组件
│   │   │   ├── HomePage.tsx         # 首页（旅程列表）
│   │   │   ├── TripDetailPage.tsx   # 旅程详情（账单/游记/统计）
│   │   │   ├── TripFormPage.tsx     # 旅程表单
│   │   │   ├── ExpenseFormPage.tsx  # 账单表单
│   │   │   ├── NoteFormPage.tsx     # 游记表单
│   │   │   ├── NoteDetailPage.tsx   # 游记详情
│   │   │   ├── ExplorePage.tsx      # 探索发现
│   │   │   ├── LoginPage.tsx        # 登录
│   │   │   ├── RegisterPage.tsx     # 注册
│   │   │   ├── ProfileEditPage.tsx  # 个人资料编辑
│   │   │   └── PublicTripDetailPage.tsx  # 公开旅程详情
│   │   ├── store/                   # Zustand 状态
│   │   ├── types/                   # TS 类型定义
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                         # VITE_API_BASE_URL
│   └── package.json
└── server/                          # Node.js 后端 (ESM)
    ├── src/
    │   ├── controllers/             # 控制器
    │   ├── middleware/              # auth, upload, errorHandler
    │   ├── routes/                  # 路由
    │   ├── services/                # 业务逻辑
    │   ├── models/                  # Sequelize 模型
    │   │   ├── User.js              # 用户模型
    │   │   ├── Trip.js              # 旅程模型
    │   │   ├── Expense.js           # 账单模型
    │   │   └── Note.js              # 游记模型
    │   ├── utils/                   # AppError, jwt 工具
    │   ├── config/                  # 数据库配置
    │   └── app.js                   # Express 配置
    ├── uploads/
    │   ├── images/                  # 永久存储图片
    │   ├── vectors/                 # SVG 矢量图
    │   └── tmp/                     # 临时文件
    │       ├── images/
    │       └── vectors/
    ├── .env                         # 环境变量
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

| 方法   | 路径                              | 说明         |
| ------ | --------------------------------- | ------------ |
| POST   | /api/auth/register                | 注册         |
| POST   | /api/auth/login                   | 登录         |
| POST   | /api/auth/refresh                 | 刷新令牌     |
| POST   | /api/trips                        | 创建旅程     |
| GET    | /api/trips                        | 旅程列表     |
| GET    | /api/trips/:id                    | 旅程详情     |
| PATCH  | /api/trips/:id                    | 更新旅程     |
| DELETE | /api/trips/:id                    | 删除旅程     |
| POST   | /api/trips/:tripId/expenses       | 创建账单     |
| GET    | /api/trips/:tripId/expenses       | 账单列表     |
| GET    | /api/trips/:tripId/expenses/stats | 账单统计     |
| PATCH  | /api/expenses/:id                 | 更新账单     |
| DELETE | /api/expenses/:id                 | 删除账单     |
| POST   | /api/trips/:tripId/notes          | 创建游记     |
| GET    | /api/trips/:tripId/notes          | 游记列表     |
| PATCH  | /api/notes/:id                    | 更新游记     |
| DELETE | /api/notes/:id                    | 删除游记     |
| POST   | /api/upload/tmp                   | 临时上传     |
| POST   | /api/upload/persist               | 持久化文件   |
| POST   | /api/upload/persist-single        | 单文件持久化 |

## 图片处理

### 上传流程

1. **临时上传（未保存）**：图片上传至 `uploads/tmp/images/`，自动生成 SVG 存放至 `uploads/tmp/vectors/`
2. **持久化（已保存）**：通过 `/api/upload/persist` 将临时文件移至 `uploads/images/` 和 `uploads/vectors/`
3. **矢量化**：游记图片使用 Jimp + Potrace 自动转换为 SVG 矢量图

### 图片替换

- 编辑账单时可更换小票图片，自动删除原文件
- 编辑游记时可更换配图，自动删除原图片和 SVG 文件

## 数据库设计

表之间通过字段名逻辑关联（如 `user_id`、`trip_id`），由应用层维护数据一致性，**不使用外键约束**。

- **users**: id (UUID), username, email, password_hash, avatar_url
- **trips**: id (UUID), user_id, title, destination, start_date, end_date, cover_image, is_ended
- **expenses**: id (UUID), trip_id, category, amount (DECIMAL), note, receipt_image, expense_date
- **notes**: id (UUID), trip_id, content (TEXT), images (JSON), vector_images (JSON), note_date

## 开发命令

```bash
# 前端开发
cd client && npm run dev

# 前端构建
cd client && npm run build

# 后端开发（热重载）
cd server && npm run dev

# 后端启动
cd server && npm start
```
