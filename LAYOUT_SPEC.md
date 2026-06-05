# NomadNotes 布局规范文档

本文档基于 `client` (React/Ant Design) 项目的页面布局规范，定义了所有前端技术栈项目统一的视觉标准。

---

## 1. 全局布局结构

### 1.1 页面容器

所有页面内容包裹在统一容器中：

```
max-width: 1000px
margin: 0 auto
padding: 0 16px
```

- 首页卡片列表使用 Row/Col 栅格布局
- 详情页/表单页使用单列居中布局
- 搜索结果页最大宽度 800px

### 1.2 页面顶部区域

```
|-- 面包屑导航（可选） margin-bottom: 16px
|-- 页面标题          margin-bottom: 24px
|-- 操作按钮区（可选） margin-bottom: 16px
|-- 主体内容
```

### 1.3 空状态/加载状态

- 加载中：使用骨架屏 (Skeleton)，8-10 行，带动画
- 空数据：使用 Empty 组件居中显示
- 错误状态：Message 提示，页面显示兜底内容

---

## 2. 间距规范

基于 8px 基础网格系统：

| Token | 值   | 用途                             |
|-------|------|----------------------------------|
| xs    | 4px  | 极小间距，图标与文字之间          |
| sm    | 8px  | 小间距，行内元素之间              |
| md    | 16px | 中等间距，卡片之间、表单项间距    |
| lg    | 24px | 大间距，区块之间、页面内边距      |
| xl    | 32px | 超大间距，页面大区块之间          |
| xxl   | 48px | 极大间距，极少使用                |

### 常用间距场景

| 场景                          | 间距值 |
|-------------------------------|--------|
| 面包屑到标题                  | 16px   |
| 标题到内容                    | 24px   |
| 卡片之间                      | 16px   |
| 区块之间 (Section)            | 24px   |
| 表单标签到输入框              | 8px    |
| 图标到文字 (行内)             | 4px    |
| 卡片内边距                    | 24px   |
| 按钮之间                      | 8px    |
| 分页器到上方内容              | 24px   |
| 操作栏 (筛选/排序) 到列表     | 16px   |

---

## 3. 色彩系统

### 3.1 基础色板

| Token              | 色值                | 用途                  |
|--------------------|---------------------|-----------------------|
| primary            | #1890ff             | 主色调，链接，主按钮   |
| success            | #52c41a             | 成功状态              |
| warning            | #faad14             | 警告状态              |
| danger / error     | #ff4d4f             | 错误/删除，金额高亮   |
| info               | #909399             | 信息/已结束状态       |

### 3.2 文字颜色

| Token            | 色值                  | 用途         |
|------------------|-----------------------|--------------|
| text-primary     | rgba(0, 0, 0, 0.85)   | 主要文字     |
| text-secondary   | rgba(0, 0, 0, 0.65)   | 次要文字     |
| text-tertiary    | rgba(0, 0, 0, 0.45)   | 辅助/禁用文字 |

### 3.3 背景与边框

| Token              | 色值     | 用途         |
|--------------------|----------|--------------|
| bg-page            | #f5f5f5  | 页面背景     |
| bg-card            | #ffffff  | 卡片背景     |
| border             | #f0f0f0  | 边框色       |
| border-hover       | #d9d9d9  | 悬停边框色   |

### 3.4 图表色板

```css
--chart-1: #667eea;
--chart-2: #764ba2;
--chart-3: #f093fb;
--chart-4: #f5576c;
--chart-5: #4facfe;
--chart-6: #00f2fe;
--chart-7: #43e97b;
--chart-8: #fa709a;
--chart-9: #a18cd1;
--chart-10: #fccb90;
```

---

## 4. 字体规范

### 4.1 字体族

```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, "Noto Sans", sans-serif;
```

### 4.2 字号层级

| Token      | 字号   | 字重   | 用途              |
|------------|--------|--------|-------------------|
| h2         | 24px   | 600    | 页面主标题         |
| h3         | 20px   | 600    | 区块标题、卡片标题  |
| h4         | 16px   | 600    | 小标题             |
| body       | 14px   | 400    | 正文               |
| caption    | 12px   | 400    | 辅助说明文字        |

### 4.3 行高

- 正文行高：1.5715（对应 14px 字号为 ~22px）

---

## 5. 组件规范

### 5.1 卡片 (Card)

```
border-radius: 8px
box-shadow: 0 1px 2px -2px rgba(0,0,0,0.16),
            0 3px 6px 0 rgba(0,0,0,0.12),
            0 5px 12px 4px rgba(0,0,0,0.09)
hover: box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
transition: box-shadow 0.3s ease
```

- 卡片之间间距：16px (margin-bottom)
- 卡片内边距：继承组件默认（~24px）
- 小尺寸卡片 (size="small")：padding ~12px
- 卡片hover使用 `shadow="hover"` 属性

### 5.2 按钮 (Button)

```
border-radius: 6px (Element Plus 默认)
间距：相邻按钮 margin-right: 8px
```

### 5.3 表格 (Table)

- 使用边框表格 (bordered)
- 分页器使用 `size="small"`
- 金额列右对齐，使用 `color: #ff4d4f; font-weight: 700` 高亮
- 日期列居中对齐

### 5.4 图片

- 普通图片：border-radius: 8px
- 封面图：border-radius: 12px
- 图片最大高度：500px
- 图片适配：object-fit: cover

### 5.5 标签 (Tag)

- 目的地/分类标签：type="primary"
- 进行中状态：type="success"
- 已结束状态：type="info"

### 5.6 骨架屏 (Skeleton)

- 行数：8 (页面级) 或 3 (卡片级)
- 带动画：animated

---

## 6. 响应式设计

### 6.1 断点

| Breakpoint | 最小宽度 | 典型设备       |
|------------|----------|----------------|
| xs         | < 576px  | 手机           |
| sm         | 576px    | 平板竖屏       |
| md         | 768px    | 平板横屏/小桌面 |
| lg         | 992px    | 桌面           |
| xl         | 1200px   | 大桌面         |
| xxl        | 1600px   | 超大桌面       |

### 6.2 卡片网格

```
xs (< 576px)  : 1 列
sm (>= 576px) : 2 列
lg (>= 992px) : 3 列
```

栅格间距 (gutter)：16px

### 6.3 描述列表 (Descriptions)

```
xs : 1 列
sm+: 2 列
```

### 6.4 统计图表面板

```
xs : 1 列 (图表 100% 宽度)
sm+: 2 列 (左右并排)
```

---

## 7. 页面级布局模式

### 7.1 列表页 (HomePage / ExplorePage)

```
[页面容器 max-width: 1000px]
  [标题] margin-bottom: 24px
  [副标题/统计] margin-bottom: 16px
  [操作栏 (搜索/筛选)] margin-bottom: 16px
  [卡片网格 Row gutter=16]
    [卡片 Col xs=24 sm=12 lg=8]
  [分页器] text-align: center; margin-top: 24px
```

### 7.2 详情页 (TripDetailPage / PublicTripDetailPage)

```
[页面容器 max-width: 1000px]
  [面包屑] margin-bottom: 16px
  [标题区域] margin-bottom: 24px
    [标题 h3]
    [标签/日期行] margin-top: 4px
  [TabBar] margin-bottom: 0
  [Tab 内容区]
    [概览 tab]
      [封面图] margin-bottom: 24px
      [描述列表 (Descriptions)]
    [列表 tab]
      [操作按钮] margin-bottom: 16px
      [表格/列表项]
```

### 7.3 表单页 (TripFormPage / NoteFormPage / ExpenseFormPage)

```
[页面容器 max-width: 800px]
  [页头/返回按钮] margin-bottom: 24px
  [卡片包裹表单]
    [表单区域]
      [表单项] margin-bottom: 16px
    [提交按钮区] margin-top: 24px
```

### 7.4 搜索结果页 (SearchResultsPage)

```
[页面容器 max-width: 800px]
  [搜索标题] margin-bottom: 24px
    [标题] font-size: 20px; font-weight: 600
    [结果数] color: rgba(0,0,0,0.45); font-size: 14px
  [筛选卡片 (可选)]
  [结果列表]
    [结果项卡片] margin-bottom: 16px
      [类型图标 + 标题]
      [描述/摘要]
      [元信息 (日期/分类)]
```

---

## 8. 图标使用规范

### 8.1 图标表

| 场景         | React (Ant Design)     | Vue3 (Element Plus) |
|--------------|------------------------|---------------------|
| 目的地/定位  | EnvironmentOutlined    | Location            |
| 日历/日期    | CalendarOutlined       | Calendar            |
| 用户/作者    | UserOutlined           | User                |
| 消费/金额    | DollarOutlined         | Money               |
| 游记/文档    | FileTextOutlined       | Document            |
| 编辑         | EditOutlined           | Edit                |
| 删除         | DeleteOutlined         | Delete              |
| 新增         | PlusOutlined           | Plus                |
| 下载/导出    | DownloadOutlined       | Download            |
| 搜索         | SearchOutlined         | Search              |
| 返回         | ArrowLeftOutlined      | ArrowLeft           |
| 上传         | UploadOutlined         | Upload              |
| 探索/发现    | CompassOutlined        | Compass             |

### 8.2 图标尺寸

- 导航栏/按钮内：14px - 16px
- 卡片内行内图标：14px
- 空状态图标：48px - 80px

---

## 9. 技术栈对齐表

| 规范项         | React (Ant Design)      | Vue3 (Element Plus)     |
|----------------|-------------------------|-------------------------|
| 卡片组件       | `<Card>`                | `<el-card shadow="hover">` |
| 栅格系统       | `<Row gutter={[16,16]}>`| `<el-row :gutter="16">` |
| 描述列表       | `<Descriptions>`        | `<el-descriptions>`     |
| 表格           | `<Table>`               | `<el-table>`            |
| 表单           | `<Form>`                | `<el-form>`             |
| 标签           | `<Tag>`                 | `<el-tag>`              |
| 面包屑         | `<Breadcrumb>`          | `<el-breadcrumb>`       |
| 分页           | `<Pagination>`          | `<el-pagination>`       |
| 空状态         | `<Empty>`               | `<el-empty>`            |
| 骨架屏         | `<Skeleton>`            | `<el-skeleton>`         |
| 头像           | `<Avatar>`              | `<el-avatar>`           |
| 对话框         | `<Modal>`               | `<el-dialog>`           |
| 消息提示       | `message`               | `ElMessage`             |
| 间距组件       | `<Space>`               | `<el-space>`            |

### 关键差异处理

| 功能点                | React (antd)                     | Vue3 (element-plus)              |
|-----------------------|----------------------------------|----------------------------------|
| Row/Col gutter        | `gutter={[16, 16]}` (数组)       | `:gutter="16"` (数值)            |
| Card hover 效果       | 默认                             | 需添加 `shadow="hover"`          |
| Table 边框            | 默认无边框                       | 默认有边框                       |
| Table size            | `"middle"`                       | `"default"` / `"small"`          |
| Descriptions column   | `column={{ xs: 1, sm: 2 }}` (对象) | `:column="2"` (数值)           |
| Tag type              | 支持 `"success"`, `"processing"` | 只支持 `"" / "success" / "info" / "warning" / "danger"` |

---

## 10. 验证清单

### 布局一致性检查

- [ ] 页面容器宽度一致 (max-width: 1000px / 800px)
- [ ] 卡片圆角一致 (8px)
- [ ] 文字层级一致 (24px / 20px / 16px / 14px / 12px)
- [ ] 间距值一致 (4/8/16/24/32/48 px)
- [ ] 色彩值一致 (主色 #1890ff, 危险色 #ff4d4f)
- [ ] 字体族一致
- [ ] 空状态展示一致
- [ ] 加载状态展示一致
- [ ] 图片圆角一致 (8px / 12px)

### 响应式检查

- [ ] 手机端 (< 576px)：卡片 1 列，Descriptions 1 列
- [ ] 平板端 (576px-992px)：卡片 2 列，Descriptions 2 列
- [ ] 桌面端 (> 992px)：卡片 3 列，Descriptions 2 列
- [ ] 导航栏移动端适配

### 交互反馈检查

- [ ] 卡片 hover 阴影效果
- [ ] 按钮点击反馈
- [ ] 表单校验错误提示
- [ ] Message 提示位置统一
- [ ] Loading 状态覆盖

---

*文档版本: 1.0 | 更新日期: 2024-03*
*基准项目: `client/` (React + Ant Design)*