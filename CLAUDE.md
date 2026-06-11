## 项目概述

**NomadNotes（游迹）** 是一个极简旅行记录全栈应用，支持旅程管理、消费记账、游记编写及图片压缩存储。
用户为每次旅程管理 **账单** 与 **游记**，旅程结束后自动生成消费统计与时间线回顾。

**多添加注释。**

**每次回复在最前面添加‘天才程序员’。**

## 数据库设计（无外键约束）

**关联规则**：表之间通过字段名逻辑关联（如 `user_id`、`trip_id`），由应用层维护数据一致性，**禁止使用 FOREIGN KEY**。

### 核心表

- **users**: id (CHAR(36) UUID), username, email, password_hash, avatar_url, created_at
- **trips**: id (CHAR(36) UUID), user_id, title, destination, start_date, end_date, cover_image, is_ended, created_at
- **expenses**: id (CHAR(36) UUID), trip_id, category, amount (DECIMAL), note, receipt_image, expense_date, created_at
- **notes**: id (CHAR(36) UUID), trip_id, content (TEXT), images (JSON), vector_images (JSON), note_date, created_at

### 特殊说明

- `notes.vector_images` 与 `images` 一一对应，预留字段，当前始终为 null。
- 级联删除由 service 层手动实现（先删子记录再删父记录）。

## API 规范

- **前缀**: `/api`
- **统一响应格式**:

  ```json
  {
    "success": true | false,
    "data": {} | [],
    "message": "错误或提示信息",
    "pagination": { "page": 1, "limit": 10, "total": 100 }
  }

  错误时 `code` 为 HTTP 状态码，`message` 描述错误。
  ```

- **分页格式**: `data` 中包含 `{ list, total, page, pageSize }`
- **认证**: `Authorization: Bearer <accessToken>`，refresh 接口 `POST /api/auth/refresh`
- **异步处理**: 全部使用 `async/await` + `try-catch(next)`
- **安全**:
  - 密码 bcrypt 加盐 (salt rounds = 10)
  - 不返回密码、secret 字段
  - 环境变量存放密钥，禁止硬编码
  - 输入校验使用 express-validator

### 核心路由

- `POST /api/auth/register`、`POST /api/auth/login`、`POST /api/auth/refresh`
- `POST /api/trips`、`GET /api/trips`、`GET /api/trips/:id`、`PATCH /api/trips/:id`、`DELETE /api/trips/:id`
- `POST /api/trips/:tripId/expenses` (multipart)、`GET /api/trips/:tripId/expenses`、`DELETE /api/expenses/:id`、`GET /api/trips/:tripId/expenses/stats`
- `POST /api/trips/:tripId/notes` (multipart, 图片自动压缩)、`GET /api/trips/:tripId/notes`、`DELETE /api/notes/:id`
- `POST /api/upload` (独立上传)

**游记图片处理细节**：

- 创建游记时，接收图片文件经 Canvas 压缩后保存至 `uploads/images/`
- `vector_images` 为预留字段，当前始终为 null
- 删除游记时，同时删除对应的原始图片文件

## 前端规范

- 组件命名 **PascalCase**，组合式 Hook 以 `use` 开头
- 响应式：基本类型用 `ref`，对象用 `reactive`（不解构）
- 路由懒加载，鉴权通过路由守卫检查
- Axios 封装：
  - 实例从环境变量 `VITE_API_BASE_URL` 读取 baseURL
  - 请求拦截器自动附加 `Authorization` 头
  - 响应拦截器对 401 清除 token 并跳转 `/login`
- 所有异步操作包裹 `try-catch`，请求错误统一提示

## 通用约束

- 所有异步必须 `try-catch`，请求必须有错误处理
- 后端全局错误中间件区分开发/生产环境（生产不暴露堆栈）
- 代码注释充分，说明意图、关键步骤，**禁止使用 Emoji**
- 图标使用 **SVG** 格式（内联或组件化），界面文案禁用 Emoji
- 数据库 **不设置外键约束**，数据一致性由应用层保证
- 所有数据库操作必须使用 ORM
- 对话记录：每次提问后需追加到 `conversation_log.md`

## 代码风格与格式化（强制统一）

- 项目必须配置 `ESLint` + `Prettier`，且提交前自动格式化（如 `husky` + `lint-staged`）。
- 缩进使用 4 个空格，不使用 Tab。
- 语句末尾必须加分号（避免 ASI 隐患）。

## 组件化与文件组织

- 单个组件文件不超过 300 行（不含样式），超过则拆分。
- 通用组件放在 `src/components/`，页面级组件放在 `src/pages/`（或 `src/views/`）。
- 组件文件夹采用 PascalCase 命名，内部文件统一使用 `index.tsx` 导出。

## 状态管理与 API 调用

- 所有 API 请求必须封装成独立函数（如 `api/user.ts`），并在调用处使用 `try-catch` 处理异常。
- 请求/响应数据需用 TypeScript 定义 `interface` 或 `type`。

## 开发命令

```bash
# 前端
cd client && npm install && npm run dev

# 后端
cd server && npm install
# 配置 .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT)
npm run dev   # nodemon src/app.js
```
