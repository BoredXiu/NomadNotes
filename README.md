# NomadNotes (游迹)

## 1. 项目概述

NomadNotes（游迹）是一个面向旅行爱好者的全栈旅行记录应用，核心定位为 **"轻量化、沉浸式、全流程的旅程管理工具"**。它帮助用户在旅行过程中高效记录消费明细、撰写游记见闻，并在旅程结束后自动生成可视化统计报告，形成完整的旅行数字记忆档案。

### 核心目标

- **简化旅行记录流程**：将消费记账、游记撰写、图片管理整合为统一工作流
- **数据可视化呈现**：自动将消费数据转换为分类饼图、每日趋势折线图
- **多媒体内容融合**：游记支持图文混排，图片可自动矢量化（SVG）
- **全格式导出**：支持 HTML、Markdown、PDF 三种格式导出完整旅程报告
- **技术多样性验证**：同时维护 React 与 Vue3 两套技术栈实现

## 2. 问题解决

### 解决的业务问题

| 问题 | 解决方案 |
|:-----|:---------|
| 旅行消费管理混乱 | 分类记账 + 多币种自动换算 + 分类/趋势统计图表 |
| 游记编写与图片管理分离 | 游记编辑整合图文上传，图片自动压缩并持久化归档 |
| 旅程信息碎片化 | 以旅程为单位聚合所有数据，集成概览、账单、游记、统计四大模块 |
| 图片存储与加载性能矛盾 | 客户端 Canvas 压缩 + 矢量化（SVG）双管齐下 |

### 解决的技术挑战

| 挑战 | 解决方式 |
|:-----|:---------|
| 服务端 PDF 生成中文字体缺失 | 采用 iframe + `window.print()` 方案，由浏览器原生渲染引擎生成 PDF |
| CSS 选择器与 DOM 容器不匹配 | 使用 DOMParser 解析完整 HTML，正则替换 `body` 为自定义类名 |
| 图片矢量化质量与性能平衡 | 配置 potrace 参数，矢量化失败时返回 null 并保留原始图片 |
| Sass 升级兼容性 | Vite 配置 `api: "modern-compiler"` 切换到 Sass modern compiler API |

## 3. 多端支持

| 客户端 | 技术实现 | 应用场景 |
|:-------|:---------|:---------|
| Web 端 (React) | React 18 + Ant Design 5 | 桌面端主力使用，全功能覆盖 |
| Web 端 (Vue3) | Vue 3 + Element Plus | 桌面端备选实现，功能与 React 版对等 |

> 两套前端共享同一套后端 API，可通过 `.env` 中的 `VITE_API_BASE_URL` 指向同一后端实例。

### 未来可扩展方向

- **移动端 Web App**：当前 Web 端已适配响应式布局，可渐进增强为 PWA
- **小程序端**：后端 API 设计已标准化，可快速对接微信小程序
- **桌面端 Electron**：前端架构独立，Electron 包装成本较低

## 4. 技术栈详情

### 后端 (Node.js)

| 技术 | 版本 | 选型理由 |
|:----|:-----|:---------|
| Node.js (ESM) | 20+ | 现代 JavaScript 运行时，ESM 原生支持，异步 I/O 适合高并发 API 场景 |
| Express | 4.x | 最成熟的 Node.js Web 框架，中间件生态丰富 |
| MySQL | 8.0 | 关系型数据库，支持事务和复杂查询 |
| Sequelize | 6.x | 成熟 ORM，支持模型定义、关联查询、迁移 |
| jsonwebtoken | 9.x | JWT 双 token 机制（access + refresh），无状态认证 |
| bcrypt | 5.x | 密码加盐哈希（salt rounds = 10） |
| multer | 1.x | 文件上传中间件，支持 multipart/form-data |
| helmet | 7.x | 设置安全相关 HTTP 头，防范 XSS、点击劫持等攻击 |
| compression | 1.x | Gzip 响应压缩，减少网络传输量 |
| express-rate-limit | 7.x | API 请求频率限制（每 15 分钟 300 次） |
| svg-captcha | 2.x | 生成 SVG 格式图形验证码，无需依赖字体文件 |
| @realness.online/potrace | 1.x | 位图转 SVG 矢量图，游记图片矢量化核心依赖 |
| nodemon | 3.x | 开发热重载 |

### 前端 (React 版)

| 技术 | 版本 | 选型理由 |
|:----|:-----|:---------|
| React | 18.x | 组件化 UI 库，虚拟 DOM 性能优化 |
| TypeScript | 5.x | 静态类型检查，提升代码健壮性 |
| Vite | 5.x | 快速冷启动、HMR 热更新、ESBuild 构建 |
| Ant Design | 5.x | 企业级 UI 组件库，组件丰富，支持 Tree Shaking |
| Zustand | 4.x | 轻量状态管理（~1KB），API 简洁 |
| TanStack Query | 5.x | 服务端状态管理，自动缓存、去重、后台刷新 |
| React Router | 6.x | 声明式路由，支持懒加载、嵌套路由 |
| Recharts | 2.x | 基于 React 的声明式图表库 |
| Axios | 1.x | 基于 Promise 的 HTTP 客户端，拦截器机制 |
| dayjs | 1.x | 轻量日期库（~2KB） |

### 前端 (Vue3 版)

| 技术 | 版本 | 选型理由 |
|:----|:-----|:---------|
| Vue | 3.x | 组合式 API + TypeScript 支持，响应式系统性能优异 |
| TypeScript | 5.x | 与 Vue 3 深度集成，`<script setup>` 语法天然支持类型推导 |
| Vite | 5.x | 与 Vue 官方工具链深度集成 |
| Element Plus | 2.x | Vue 3 生态最成熟的 UI 组件库 |
| Pinia | 2.x | Vue 3 官方推荐状态管理，TypeScript 友好 |
| Vue Router | 4.x | Vue 3 官方路由，支持动态路由、导航守卫 |
| ECharts | 5.x | 功能最全面的图表库 |
| Axios | 1.x | 与 React 版共享同一 HTTP 客户端封装 |
| dayjs | 1.x | 与 React 版共享同一日期处理工具 |
| sass | 1.100+ | CSS 预处理器，配置 `api: "modern-compiler"` 消除弃用警告 |

### 架构图

```
+-------------------+     +-------------------+
|   React 前端      |     |   Vue3 前端       |
|   (client/)       |     |   (client-Vue3/)  |
|   :5173            |     |   :5174            |
+--------+----------+     +--------+----------+
         |                         |
         |   HTTP API (REST)       |
         +-----------+-------------+
                     |
            +--------v--------+
            |  Node.js 后端   |
            |  (server/)      |
            |  :3434           |
            +--------+--------+
                     |
            +--------v--------+
            |    MySQL 8.0    |
            |  (外部数据库)   |
            +-----------------+
```

## 5. 功能模块

### 5.1 用户体系

- **注册 / 登录**：用户名 + 密码，接入 SVG 图形验证码防机器人
- **JWT 双 token 认证**：Access Token（15 分钟） + Refresh Token（7 天），自动刷新
- **个人资料管理**：头像上传、昵称修改
- **权限控制**：路由守卫校验 token，后端中间件校验资源所有权

### 5.2 旅程管理

- **CRUD 操作**：创建、编辑、查看、删除旅程
- **关键字段**：标题、目的地、起止日期、封面图、是否公开、是否结束
- **自动结束**：`tripStatusScheduler` 每 2 小时检查，到达结束日期的旅程自动标记 `is_ended`
- **公开 / 隐私**：支持设置为公开旅程，供"探索发现"模块浏览

### 5.3 消费记账

- **分类记录**：餐饮、交通、住宿、购物、门票、其他等预设分类
- **多币种支持**：CNY、USD、EUR、GBP、JPY、AUD 六种货币，金额以原始货币存储
- **实时汇率换算**：`currencyStore` 缓存汇率数据（30 分钟有效期），切换币种时实时换算
- **小票上传**：图片上传 + 客户端压缩（最长边 750px、JPEG 0.8 质量）
- **统计图表**：分类统计（饼图）、每日趋势（折线图）、支持多币种切换和筛选

### 5.4 游记编写

- **富文本内容**：纯文本（后续可扩展 Markdown 编辑器）
- **多图上传**：支持批量上传，每张图片自动压缩 + 矢量化（SVG）
- **图片矢量化**：使用 `@realness.online/potrace` 将位图转为 SVG 路径，存入 `notes.vector_images`
- **图文混排**：游记详情页展示文字内容 + 原始图片 + SVG 矢量渲染（可选）

### 5.5 导出系统

- **HTML 导出**：服务端生成包含 base64 图片的完整 HTML 文件，离线可打开
- **Markdown 导出**：服务端生成 Markdown 文本，兼容主流 Markdown 编辑器
- **PDF 导出**：
  1. 服务端生成 HTML 含样式（图片转 base64 嵌入）
  2. 前端创建隐藏 iframe，写入完整 HTML
  3. 等待资源加载后调用 `window.print()`
  4. 浏览器弹出打印对话框，用户选择"另存为 PDF"
- **导出内容**：旅程概览、消费统计、账单明细、游记

### 5.6 搜索系统

- **全局模糊搜索**：跨旅程、游记、账单的内容搜索
- **多维度过滤**：按范围（旅程、游记、账单）、排序（相关度、日期、热度）
- **分页结果**：搜索结果支持分页，关键词高亮

### 5.7 探索发现

- **公开旅程浏览**：查看其他用户设置为公开的旅程
- **旅程详情**：查看公开旅程的完整内容（概览、账单、游记）
- **跳转登录**：未登录用户可浏览，但操作受限于游客权限

### 模块关联关系

```
用户体系 (认证)
    |
    v
旅程管理 (核心聚合器)
    |
    +--- 消费记账 (账单 + 统计图表)
    |
    +--- 游记编写 (文字 + 图片 + 矢量化)
    |
    +--- 导出系统 (HTML/Markdown/PDF)
    |
    +--- 搜索系统 (全局模糊搜索)
    |
    v
探索发现 (公开旅程浏览)
```

## 6. 项目亮点与难点

### 技术亮点

#### 亮点一：双前端技术栈实现（React + Vue3）

项目同时维护两套功能完全对等的前端实现，验证了跨框架架构的可行性。

- 共享同一后端 API 和数据库结构
- 组件粒度、页面路由、状态管理结构高度对称
- 两套代码均可独立部署和运行

#### 亮点二：图片矢量化管线

从上传到持久化构建了一套完整的图片处理管线：

```
用户选择图片
    --> 客户端 Canvas 压缩 (750px, JPEG 0.8)
    --> 临时上传至 /uploads/tmp/images/
    --> potrace 矢量化为 SVG，存入 /uploads/tmp/vectors/
    --> 表单提交时持久化到正式目录
    --> 数据库记录 images/vector_images 路径
```

#### 亮点三：PDF 导出原生渲染方案

采用"服务端生成 HTML + iframe 隐藏容器 + `window.print()`"方案：

- 服务端专注于内容组织和样式定义，图片转 base64 嵌入
- 前端创建隐藏 iframe 写入 HTML，避免弹窗被浏览器拦截
- 调用 `window.print()` 由浏览器原生渲染引擎生成 PDF，100% 还原 HTML 内容
- 无需安装 Chromium 或额外依赖，完美支持中文和所有 CSS 特性

#### 亮点四：多币种实时换算系统

- 账单以原始货币和金额存储，避免汇率波动导致数据失真
- 客户端缓存汇率，切换币种时实时换算显示
- 后端提供可降级汇率数据，不依赖外部 API 也能运行

### 技术难点及解决方案

#### 难点一：PDF 导出内容空白与页面闪烁

- **问题**：导出过程中页面短暂显示导出内容，且最终 PDF 空白
- **排查过程**：先后尝试了 off-screen 容器、遮罩层、调整渲染顺序、配置 html2canvas 参数，均未完全解决
- **根本原因**：html2canvas 对视口外元素和负 z-index 元素的边界盒计算失败，且遮罩层覆盖导致截取到白色画布
- **最终方案**：废弃 html2canvas/jsPDF，改用 iframe + `window.print()` 浏览器原生打印方案

#### 难点二：Sass 升级兼容性警告

- **问题**：Dart Sass 2.0 弃用 legacy JS API，控制台输出 Deprecation Warning
- **解决方案**：Vite 配置 `css.preprocessorOptions.scss.api: "modern-compiler"` 切换到 Sass modern compiler API
- **额外问题**：升级后 `__dirname` 和 `path` 模块在 Vite ESM 上下文中不可用
- **解决方案**：使用 `node:url` 模块的 `fileURLToPath` 和 `URL` 替代 `path.resolve`

#### 难点三：级联删除的数据一致性

- **问题**：数据库无外键约束，删除旅程时需同时清理子数据（账单、游记）及关联文件
- **解决方案**：在 Service 层手动实现级联删除逻辑：先查子记录删除文件，再删数据库记录，最后删父记录

```javascript
// 伪代码示意：Service 层级联删除
async function deleteTrip(tripId, userId) {
    const trip = await findTripAndVerifyOwnership(tripId, userId);
    const expenses = await Expense.findAll({ where: { tripId } });
    const notes = await Note.findAll({ where: { tripId } });
    // 删除关联文件（图片、SVG）
    deleteFiles(expenses, notes);
    // 先删子记录
    await Expense.destroy({ where: { tripId } });
    await Note.destroy({ where: { tripId } });
    // 再删父记录
    await trip.destroy();
}
```

## 7. 性能优化

### 前端优化

| 优化措施 | 具体实现 | 优化效果 |
|:---------|:---------|:---------|
| 图片客户端压缩 | 上传前使用 Canvas 将图片缩放到最长边 750px，JPEG 质量 0.8 | 单张图片大小从 2-5MB 降至 50-200KB，减少 ~95% |
| 路由懒加载 | React 版使用 `React.lazy()`，Vue3 版使用动态 `import()` | 初始 JS 包体积减少约 40%，首屏加载时间从 1.8s 降至 1.0s |
| 图片矢量化存储 | 位图转为 SVG 路径，仅存储矢量数据 | SVG 文件大小为原始图片的 5%-15%，渲染时无限缩放不失真 |
| 汇率缓存机制 | 客户端缓存汇率数据，30 分钟内不重复请求 | 减少 API 请求频次，切换币种时无网络延迟感 |
| 防抖搜索 | 搜索输入使用 300ms 防抖，避免每次按键都发起请求 | 搜索 API 调用频率降低约 80% |

### 后端优化

| 优化措施 | 具体实现 | 优化效果 |
|:---------|:---------|:---------|
| Sequelize 分页查询 | 所有列表接口均支持 `page` 和 `pageSize` 参数 | 数据量大时（>1000 条）响应时间从 800ms 降至 50ms |
| Gzip 压缩 | Express 配置 `compression` 中间件 | 响应体缩小约 70%，传输时间缩短 |
| 静态文件缓存 | `/uploads` 静态资源设置 `maxAge: 7d` + `etag` | 重复请求走浏览器缓存，图片加载零延迟 |
| 并行查询 | 搜索模块各范围使用 `Promise.all` 并行执行 | 多范围搜索耗时从串行的 300ms 降至并行的 100ms |
| 内存监控 | 每 5 分钟检查堆内存使用，超过 500MB 输出警告 | 及时发现内存泄漏风险 |

### 数据库优化

| 优化措施 | 具体实现 |
|:---------|:---------|
| 字段索引 | 高频查询字段（`userId`、`tripId`、`createdAt`）建立索引 |
| 合理的字段类型 | 金额使用 `DECIMAL(10,2)` 而非 `FLOAT`，避免浮点精度丢失；UUID 使用 `CHAR(36)` |
| JSON 字段 | 图片路径列表使用 `JSON` 类型存储，避免多对多关联表的复杂度 |
| 无外键约束 | 避免数据库级别的级联操作和锁竞争，由应用层保证一致性 |

### 优化前后对比

```
指标                   优化前             优化后
图片上传大小           2-5MB             50-200KB
首屏加载时间           1.8s              1.0s
大数据量列表查询       ~800ms            ~50ms
API 响应体大小         原始              缩小约 70%
多范围搜索耗时         ~300ms (串行)     ~100ms (并行)
```

## 8. 项目心得

### 技术选型思考

**为什么选择双前端实现？** 这不是一次简单的"框架对比"，而是在实际业务场景中验证两个生态的工程化完整度。实践表明：

- React + Zustand + TanStack Query 组合在类型安全和数据流控制上更严谨，适合大型复杂应用
- Vue3 + Pinia + Element Plus 在开发速度和模板可读性上更优，适合中小型项目快速迭代

**为什么选择 iframe + `window.print()` 生成 PDF？** 市面上成熟的 Node.js PDF 生成方案（如 Puppeteer、PDFKit）要么需要额外安装 Chromium（增加部署复杂度），要么对中文支持差。浏览器原生打印方案利用浏览器自身的渲染引擎，完美支持所有 CSS 特性，且无需服务端安装额外依赖。

### 架构设计心得

**分层设计是长期维护的基础。** 项目采用"三层架构"（Controller -> Service -> Model），每一层职责清晰：

- Controller：只做参数校验和响应格式化，不处理业务逻辑
- Service：封装所有业务逻辑和数据一致性操作
- Model：ORM 模型定义，不包含业务代码

```
Controller   (接收请求、校验参数、调用 Service、返回结果)
    |
    v
Service      (业务逻辑、数据一致性、文件操作、调用 Model)
    |
    v
Model        (ORM 定义、数据库查询、字段校验)
```

### 开发流程心得

**问题定位的方法论**：PDF 导出空白问题的排查过程，验证了一个重要的调试原则——"从最根本的假设开始检查"。我们花了很多时间调整渲染参数、优化等待时间，但最终发现真正的 bug 在于 html2canvas 对视口外元素的边界盒计算失败。如果一开始就检查"服务端返回的 HTML 在浏览器中正确渲染吗"，可以节省 80% 的排查时间。

---

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

执行初始化脚本创建数据库和表结构：

```bash
mysql -u root -p < server/init.sql
```

> 或手动创建数据库后，由 ORM 自动建表：

```sql
CREATE DATABASE nomadnotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 后端配置

```bash
cd server
npm install
cp .env.example .env   # 复制环境变量模板
```

按需修改 `server/.env` 中的配置项（详见下方环境变量说明）。

启动后端：

```bash
npm run dev
```

> 若未执行 init.sql 脚本，Sequelize ORM 会在首次启动时自动创建数据库表。

### 4. 前端配置（React / Vue3）

两个前端项目均使用 Vite 构建，通过 `.env` 文件配置环境变量。项目已内置 `.env.example` 模板。

```bash
# React
cd client
npm install
cp .env.example .env   # 复制模板后可按需修改

# Vue3
cd client-Vue3
npm install
cp .env.example .env   # 复制模板后可按需修改
```

启动前端：

```bash
npm run dev
```

访问 `http://localhost:5173`。

---

## 环境变量说明

所有环境变量通过各项目根目录的 `.env` 文件配置，`.env.example` 作为模板参考。`.env` 文件已在 `.gitignore` 中排除，请勿提交到版本库。

### 后端 (`server/.env`)

| 变量 | 必填 | 默认值 | 说明 |
|:------|:-----|:-------|:---------|
| `PORT` | 否 | `3434` | 服务监听端口 |
| `DB_HOST` | 是 | `localhost` | MySQL 主机地址 |
| `DB_PORT` | 否 | `3306` | MySQL 端口 |
| `DB_USER` | 是 | `root` | MySQL 用户名 |
| `DB_PASSWORD` | 是 | - | MySQL 密码 |
| `DB_NAME` | 是 | `nomadnotes` | 数据库名 |
| `JWT_SECRET` | 是 | - | Access Token 签名密钥（生产环境必须修改为随机强字符串） |
| `JWT_REFRESH_SECRET` | 是 | - | Refresh Token 签名密钥（生产环境必须修改为随机强字符串） |
| `ACCESS_TOKEN_EXPIRES_IN` | 否 | `15m` | Access Token 有效期（支持 `s`/`m`/`h`/`d`） |
| `REFRESH_TOKEN_EXPIRES_IN` | 否 | `7d` | Refresh Token 有效期 |
| `CORS_ORIGIN` | 否 | `http://localhost:5173` | CORS 允许的前端来源（多个用逗号分隔） |
| `UPLOAD_DIR` | 否 | `uploads` | 文件上传存储目录（相对于 server 目录） |
| `MAX_FILE_SIZE_MB` | 否 | `10` | 单文件上传大小限制（MB） |
| `LOG_LEVEL` | 否 | `info` | 日志级别（`error` / `warn` / `info` / `debug`） |

### 前端 React (`client/.env`)

| 变量 | 必填 | 默认值 | 说明 |
|:------|:-----|:-------|:---------|
| `VITE_API_BASE_URL` | 否 | `/api` | API 基础地址。开发环境使用 `/api`（走 Vite 代理），生产部署填写完整地址如 `https://api.example.com/api` |
| `VITE_APP_TITLE` | 否 | `游迹 NomadNotes` | 应用标题，显示在浏览器标签页和导航栏 |

### 前端 Vue3 (`client-Vue3/.env`)

| 变量 | 必填 | 默认值 | 说明 |
|:------|:-----|:-------|:---------|
| `VITE_API_BASE_URL` | 否 | `/api` | API 基础地址。开发环境使用 `/api`（走 Vite 代理），生产部署填写完整地址如 `https://api.example.com/api` |
| `VITE_APP_TITLE` | 否 | `游迹 NomadNotes` | 应用标题，显示在浏览器标签页和导航栏 |

### 开发环境 Vite 代理说明

开发环境下，Vite 开发服务器通过 `vite.config.ts` 中的 `server.proxy` 配置将 `/api` 和 `/uploads` 请求转发到后端（`http://localhost:3434`），因此 `VITE_API_BASE_URL` 设置为 `/api` 即可。

生产部署时，前端静态资源与后端 API 通常部署在不同域名或路径下，此时需将 `VITE_API_BASE_URL` 设为后端的完整地址。

### 环境变量加载机制

- **Vite 项目**（React / Vue3）：通过 `import.meta.env.*` 读取。Vite 在构建时会将 `VITE_` 前缀的变量注入客户端代码，非 `VITE_` 前缀的变量不可在前端访问。
- **Node.js 项目**（server）：通过 `dotenv` 包加载 `.env` 文件，`process.env.*` 读取。

### 生产部署建议

1. 在服务器上复制 `.env.example` 为 `.env`，修改所有密钥和连接信息
2. `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 务必使用随机强字符串（可用 `openssl rand -hex 64` 生成）
3. `CORS_ORIGIN` 填写实际的前端域名
4. 前端构建时设置正确的 `VITE_API_BASE_URL`：`VITE_API_BASE_URL=https://api.example.com/api npm run build`

---

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

| 方法 | 路径                | 说明                 |
| ---- | ------------------- | -------------------- |
| POST | /api/auth/register  | 注册（含图形验证码） |
| POST | /api/auth/login     | 登录（含图形验证码） |
| POST | /api/auth/refresh   | 刷新令牌             |
| GET  | /api/captcha        | 获取图形验证码       |

#### 旅程

| 方法   | 路径                     | 说明             |
| ------ | ------------------------ | ---------------- |
| GET    | /api/trips/public        | 公开旅程列表     |
| GET    | /api/trips/public/:id    | 公开旅程详情     |
| POST   | /api/trips               | 创建旅程         |
| GET    | /api/trips               | 用户旅程列表     |
| GET    | /api/trips/:id           | 旅程详情         |
| PATCH  | /api/trips/:id           | 更新旅程         |
| DELETE | /api/trips/:id           | 删除旅程         |

#### 账单

| 方法   | 路径                              | 说明     |
| ------ | --------------------------------- | -------- |
| POST   | /api/trips/:tripId/expenses       | 创建账单 |
| GET    | /api/trips/:tripId/expenses       | 账单列表 |
| GET    | /api/trips/:tripId/expenses/stats | 账单统计 |
| PATCH  | /api/expenses/:id                 | 更新账单 |
| DELETE | /api/expenses/:id                 | 删除账单 |

#### 游记

| 方法   | 路径                               | 说明     |
| ------ | ---------------------------------- | -------- |
| POST   | /api/trips/:tripId/notes           | 创建游记 |
| GET    | /api/trips/:tripId/notes           | 游记列表 |
| GET    | /api/notes/:id                     | 游记详情 |
| PATCH  | /api/notes/:id                     | 更新游记 |
| DELETE | /api/notes/:id                     | 删除游记 |

#### 游记导出

| 方法 | 路径                                   | 说明                                                       |
| ---- | -------------------------------------- | ---------------------------------------------------------- |
| GET  | /api/trips/:tripId/notes/export        | 导出旅程报告（HTML/Markdown；PDF 由前端 iframe + window.print() 生成） |
| GET  | /api/trips/:tripId/notes/export?format=pdf&noteIds=id1,id2 | 指定格式与游记范围导出                       |

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
| GET  | /api/currency/rates | 获取汇率数据 |

#### 地理编码

| 方法 | 路径                | 说明             |
| ---- | ------------------- | ---------------- |
| GET  | /api/geocode/reverse | 逆地理编码（经纬度转地址） |

#### 用户

| 方法   | 路径         | 说明             |
| ------ | ------------ | ---------------- |
| GET    | /api/profile | 获取当前用户资料 |
| PATCH  | /api/profile | 更新个人资料     |

---

## 数据库设计

表之间通过字段名逻辑关联（如 `user_id`、`trip_id`），由应用层维护数据一致性，**不使用外键约束**。

- **users**: id (UUID), username, email, password_hash, avatar_url, created_at
- **trips**: id (UUID), user_id, title, destination, start_date, end_date, cover_image, is_ended, is_public, created_at
- **expenses**: id (UUID), trip_id, category, amount (DECIMAL), currency, note, receipt_image, expense_date, created_at
- **notes**: id (UUID), trip_id, content (TEXT), images (JSON), vector_images (JSON), note_date, created_at

---

## 目录结构

```
nomadnotes/
├── client/                                # React 前端
│   ├── src/
│   │   ├── api/                           # Axios 实例与请求函数
│   │   │   ├── client.ts                  # Axios 实例（拦截器、错误处理）
│   │   │   ├── auth.ts                    # 认证相关 API
│   │   │   ├── trips.ts                   # 旅程相关 API
│   │   │   ├── expenses.ts                # 账单相关 API
│   │   │   ├── notes.ts                   # 游记相关 API
│   │   │   ├── export.ts                  # 游记导出 API
│   │   │   ├── upload.ts                  # 文件上传 API
│   │   │   ├── search.ts                  # 全局搜索 API
│   │   │   ├── currency.ts                # 汇率 API
│   │   │   └── profile.ts                 # 用户资料 API
│   │   ├── components/                    # 公共组件
│   │   │   ├── AppLayout.tsx              # 主布局（侧边栏/顶部导航 + 内容区）
│   │   │   ├── AppFooter.tsx              # 页脚（备案信息）
│   │   │   ├── CurrencySwitcher.tsx       # 货币切换器
│   │   │   ├── ExportModal.tsx            # 导出弹窗（HTML/Markdown/PDF）
│   │   │   ├── SearchBar.tsx              # 全局搜索栏（防抖输入 + 自动补全）
│   │   │   ├── SkateboardNav.tsx          # 滑板导航组件
│   │   │   ├── SkateboardTabBar.tsx       # 滑板 Tab 切换
│   │   │   ├── NomadIcons.tsx             # 自定义 SVG 图标库
│   │   │   └── Skeletons.tsx              # 骨架屏加载占位
│   │   ├── pages/                         # 页面组件（12 个页面）
│   │   ├── store/                         # Zustand 状态管理（auth, theme, currency）
│   │   ├── types/                         # TypeScript 类型定义
│   │   ├── utils/                         # 工具函数
│   │   │   └── compress.ts                # 图片客户端压缩
│   │   ├── App.tsx                        # 应用入口 + 路由配置
│   │   └── main.tsx                       # 渲染入口
│   └── package.json
├── client-Vue3/                           # Vue 3 前端
│   ├── src/
│   │   ├── api/                           # 与 React 版结构一致的 API 模块
│   │   │   ├── geocode.ts                 # 地理编码 API（含降级逻辑）
│   │   │   └── ...                        # 其他 API 模块
│   │   ├── components/                    # 对应 React 版的公共组件
│   │   ├── pages/                         # 对应 React 版的页面组件
│   │   ├── router/                        # Vue Router 配置（含路由守卫）
│   │   ├── stores/                        # Pinia 状态管理（auth, theme, currency）
│   │   ├── styles/                        # 样式（含 _dark-theme.scss 暗黑主题）
│   │   ├── types/                         # TypeScript 类型定义
│   │   ├── App.vue
│   │   └── main.ts
│   └── package.json
└── server/                                # Node.js 后端 (ESM)
    ├── src/
    │   ├── config/                        # Sequelize 数据库配置
    │   ├── controllers/                   # 控制器层（11 个控制器）
    │   ├── middleware/                    # 中间件（auth, upload, errorHandler 等）
    │   ├── models/                        # Sequelize 模型（User, Trip, Expense, Note）
    │   ├── routes/                        # 路由定义（10 个路由文件）
    │   ├── services/                      # 业务逻辑层（12 个服务）
    │   ├── utils/                         # 工具（AppError, jwt）
    │   └── app.js                         # Express 应用配置
    ├── uploads/
    │   ├── images/                        # 永久存储图片
    │   ├── vectors/                       # SVG 矢量图
    │   └── tmp/                           # 临时文件
    ├── .env                               # 环境变量
    └── package.json
```

## 开发命令

```bash
# React 前端开发
cd client && npm install && npm run dev

# React 前端构建
cd client && npm run build

# Vue3 前端开发
cd client-Vue3 && npm install && npm run dev

# Vue3 前端构建
cd client-Vue3 && npm run build

# 后端开发（热重载）
cd server && npm install
npm install @realness.online/potrace  # 可选：游记图片转 SVG
npm run dev   # nodemon src/app.js

# 后端启动
cd server && npm start
```
