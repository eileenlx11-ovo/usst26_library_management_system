# 图书馆管理系统 — 前端

> 数据库原理课程大作业 · 前端负责人B

基于纯 HTML/CSS/JavaScript 的图书馆管理系统，采用前后端分离架构，支持三级角色权限隔离、借阅闭环自动计费、统计可视化。

## 目录结构

```
├── index.html          # 仪表盘（指标卡片 + 待办事项 + 快速入口）
├── books.html          # 图书管理（搜索筛选 + 库存管理 + 借阅按钮）
├── borrow.html         # 借阅管理（快速借阅 + 续借归还 + 罚款缴纳 + 催还）
├── readers.html        # 读者管理（CRUD + 性别/类型/状态字段）
├── report.html         # 统计报表（热门图书柱状图 + 活跃读者柱状图 + 逾期名单）
├── admin.html          # 系统安全（权限管理 + 分类维护 + 规则配置 + 备份恢复）
├── login.html          # 登录页（三角色登录）
├── styles.css          # 全局样式（深绿侧边栏 + 绿色主色调）
├── script.js           # 主业务逻辑
└── js/
    ├── api.js          # API 服务层（统一封装后端接口）
    └── mock-data.js    # Mock 数据层（后端未就绪时的回退）
```

## 角色权限分配

| 页面 | 读者 | 图书管理员 | 系统管理员 |
|------|:--:|:--------:|:--------:|
| 仪表盘（index.html） | ✅ 个人统计 | ✅ 全局统计+待办 | ✅ 全局统计+待办 |
| 图书查询（books.html） | ✅ 搜索+借阅 | ✅ 搜索+CRUD | ✅ 搜索+CRUD |
| 借阅管理（borrow.html） | ✅ 个人记录+续借/归还 | ✅ 全部记录+快速借阅+催还+罚款 | ✅ 全部记录+快速借阅+催还+罚款 |
| 读者管理（readers.html） | ❌ | ✅ CRUD | ✅ CRUD |
| 统计报表（report.html） | ❌ | ❌ | ✅ 图表+逾期名单 |
| 系统安全（admin.html） | ❌ | ❌ | ✅ 权限/分类/规则/备份 |

## 已实现功能

### 读者
- 按书名 / 作者 / ISBN / 分类搜索图书，支持分类和库存状态筛选
- 一键借阅（自动校验读者状态、借阅数量上限）
- 续借图书（单次限制，逾期不可续借）
- 归还图书（后端自动计算逾期罚款）
- 查看个人借阅记录及应还日期
- 查看个人罚款记录并缴纳
- 修改个人信息（用户名 / 密码 / 头像）

### 图书管理员
- 图书信息管理：添加、修改、删除（含书名、作者、ISBN、出版社、分类、总册数、可借册数）
- 读者管理：添加、修改、删除（含借书证号、姓名、性别、类型、电话、邮箱、状态）
- 快速借阅：录入借书证号 + 图书编号，自动按规则生成应还日期
- 归还处理：归还时自动生成逾期罚款
- 逾期催还通知：一键检查并生成催还名单
- 罚款管理：查看并标记已缴纳

### 系统管理员
- 用户权限管理：新增 / 编辑 / 删除用户及其角色
- 图书分类管理：chip 标签展示，支持添加和删除
- 借阅规则设置：最大借阅数量、借阅天数、每日逾期费、最大续借次数、续借天数
- 数据备份与恢复：备份到 localStorage，一键恢复
- 统计报表：
  - 🔥 热门图书排行（横向柱状图，按借阅次数）
  - ⭐ 活跃读者排行（横向柱状图，按借阅次数）
  - ⚠️ 逾期催还名单（读者、电话、图书、应还日期、逾期天数、预计罚款）

### 仪表盘
- 4 个指标卡片：馆藏图书 / 可借库存 / 借阅中 / 待缴罚款
- 待办事项列表（逾期催还 / 库存不足 / 未缴罚款），点击可一键跳转到对应页面

## 后端对接状态

| 接口 | 状态 | 说明 |
|------|:--:|------|
| `POST /bookadmin/borrow/lend` | ✅ 已对接 | 借书时调真实API |
| `POST /bookadmin/borrow/return` | ✅ 已对接 | 还书时调真实API，后端自动算罚款 |
| `POST /bookadmin/borrow/renew` | ✅ 已对接 | 续借时调真实API |
| `POST /bookadmin/borrow/notify` | ✅ 已对接 | 逾期催还检查 |
| 图书 / 读者 / 分类 / 规则 / 报表 | ⚠️ mock | 后端空壳，前端用本地数据回退 |

统一响应格式：

```json
{ "code": 1, "msg": "success", "data": "业务信息或 null" }
```

- `code = 1` → 成功，`code = 0` → 失败（错误信息在 `msg` 字段）
- 所有接口均为 POST，参数通过 Query String 传递

## 使用方法

1. 直接在浏览器中打开 `login.html` 即可运行（纯静态页面，无需服务器）
2. 示例账号：

| 用户名 | 密码 | 角色 | 关联读者 |
|--------|------|------|---------|
| admin | admin123 | 系统管理员 | — |
| lib_manager1 | libmgr123 | 图书管理员 | — |
| chensiyuan | csy12345 | 读者 | 陈思远（本科生） |
| zhangminghui | zmh12345 | 读者 | 张明慧（研究生） |
| majianguo | mjg12345 | 读者 | 马建国（教师） |

3. 如需连接后端，启动 Spring Boot 后前端会自动调用 `http://localhost:8080` 上的接口
4. 后端未就绪时，所有功能自动回退到本地 mock 数据，不影响演示

## 数据库模块

项目包含完整的数据库设计与实现，位于 `database/` 目录：

```
database/
├── sql/
│   ├── 01_图书模块_建表.sql      ← Author, Publisher, Category, Book
│   ├── 02_借阅模块_建表.sql      ← Reader, Rule, BorrowRecord, Fine, User, InviteCode + 索引
│   ├── 03_罚款触发器.sql         ← 3 个触发器（自动罚款/库存增减）
│   ├── 04_用户注册存储过程.sql    ← sp_register_user（事务注册 + 邀请码验证）
│   └── 05_视图与存储过程.sql      ← 5 个视图 + 4 个存储过程（借/还/续/缴罚款）
├── data/
│   └── 04_全部插入数据.sql       ← 10 张表完整测试数据（15作者/8出版社/10书/20读者/30借阅）
├── query/
│   ├── 05_展示查询.sql           ← 答辩演示脚本（统计报表 + 存储过程调用）
│   └── 06_字段查询.sql           ← INFORMATION_SCHEMA 字段报告
└── design/
    ├── 系统数据库设计.md           ← 关系模式 + 3NF范式分析 + 外键关系 + 索引设计
    └── 图书管理系统总E-R图.drawio   ← 完整系统 E-R 图
```

建库执行顺序：`01_建表` → `02_建表` → 数据插入 → `03_触发器` → `05_视图与存储过程` → `04_注册存储过程`

## 仓库说明

```
数据库大作业前端/
├── index.html ~ admin.html    ← 7 个功能页面（前端B整合成果）
├── login.html                 ← 登录/注册页
├── styles.css                 ← 全局样式（深绿侧边栏配色）
├── script.js                  ← 主业务逻辑（角色权限+API对接）
├── js/api.js                  ← API 服务层
├── js/mock-data.js            ← Mock 数据（与数据库 schema 完全对齐）
├── database/                  ← 🆕 数据库模块（建表/触发器/存储过程/测试数据/查询脚本）
├── 前端A/                     ← 前端负责人A 参考代码（未修改）
└── 后端接口/                   ← 后端同学 Spring Boot 代码（未修改）
```

**本次 push** 包含根目录前端文件 + `database/` 目录。`前端A/` 和 `后端接口/` 未做改动。

---

## 全链路实现状态总览

图例：✅ 已实现 · 🔧 有逻辑但后端空壳 · ❌ 完全空壳

### 数据库（database/）— 10 表 + 8 过程/触发器 + 5 视图

| 表 | 建表 | 数据 | 表 | 建表 | 数据 |
|------|:--:|:--:|------|:--:|:--:|
| Author（15条） | ✅ | ✅ | Publisher（8条） | ✅ | ✅ |
| Category（8类） | ✅ | ✅ | Book（10本·外键关联） | ✅ | ✅ |
| Reader（20条·4类型） | ✅ | ✅ | Rule（4条·按类型） | ✅ | ✅ |
| BorrowRecord（30条） | ✅ | ✅ | Fine（6条） | ✅ | ✅ |
| User（20条·角色+reader_id） | ✅ | ✅ | InviteCode（9条种子） | ✅ | ✅ |

| 触发器 / 存储过程 | 状态 | 用途 |
|------|:--:|------|
| trg_auto_create_fine | ✅ | 归还时自动生成逾期罚款 |
| trg_borrow_decrease_stock | ✅ | 借出时自动扣减库存 |
| trg_return_increase_stock | ✅ | 归还时自动恢复库存 |
| sp_register_user | ✅ | 用户注册事务（验证邀请码→创建User→标记已用） |
| sp_borrow_book | ✅ | 借书（校验状态/库存/上限） |
| sp_renew_book | ✅ | 续借（校验是否已续借） |
| sp_return_book | ✅ | 还书（计算逾期天数） |
| sp_pay_fine | ✅ | 缴纳罚款 |

| 视图 | 状态 | 用途 |
|------|:--:|------|
| v_current_borrow | ✅ | 当前借阅中记录（含剩余天数） |
| v_overdue_readers | ✅ | 逾期读者名单（含预计罚款） |
| v_book_borrow_stats | ✅ | 图书借阅统计（累计/在借/逾期） |
| v_reader_summary | ✅ | 读者借阅概况（在借/逾期/未缴罚款） |
| v_fine_detail | ✅ | 罚款明细（含读者/图书/金额/状态） |

> ⚠️ SQL 脚本齐全但需要实际导入 MySQL 才能供后端使用。

### 后端（后端接口/）— 10 个 Controller

| Controller | 路径 | 已实现端点 | 状态 |
|------|------|------|:--:|
| bookadmin/BorrowController | `/bookadmin/borrow` | lend / return / renew / notify | ✅ 4/4 |
| bookadmin/BookController | `/bookadmin/book` | — | ❌ 空壳 |
| bookadmin/ReaderController | `/bookadmin/reade` | — | ❌ 空壳 |
| reader/BookController | `/reader/book` | — | ❌ 空壳 |
| reader/BorrowController | `/reader/borrow` | — | ❌ 空壳 |
| reader/ReaderController | `/reader` | — | ❌ 空壳 |
| systemadmin/AdminController | `/systemadmin/admin` | — | ❌ 空壳 |
| systemadmin/BookController | `/systemadmin/book` | — | ❌ 空壳 |
| systemadmin/BorrowController | `/systemadmin/borrow` | — | ❌ 空壳 |
| systemadmin/ToolController | `/systemadmin/tool` | — | ❌ 空壳 |

### 前端 — 7 页 × 3 层

| 页面 | UI/交互 | 数据源 | API对接 |
|------|:--:|:--:|:--:|
| login.html | ✅ | MockData.users | 🔧 注册+登录走 localStorage |
| index.html | ✅ | MockData | 🔧 4指标+待办·本地计算 |
| books.html | ✅ | MockData.books | 🔧 搜索/CRUD·mock |
| borrow.html | ✅ | 混合 | ✅ 借/还/续/催→**真实API**，记录表→mock |
| readers.html | ✅ | MockData.readers | 🔧 CRUD·mock |
| report.html | ✅ | MockData | 🔧 图表+逾期名单·本地计算 |
| admin.html | ✅ | MockData | 🔧 用户/分类/规则/备份·mock |

### 汇总

| 层级 | 总数 | 已实现 | 空壳 |
|------|:--:|:--:|:--:|
| 数据库表 | 10 | **10** ✅ | 0 |
| 触发器 + 存储过程 | 8 | **8** ✅ | 0 |
| 视图 | 5 | **5** ✅ | 0 |
| 后端 Controller | 10 | **1**（BorrowController） | **9** |
| 后端 API 端点 | ~20 | **4**（借/还/续/催） | **~16** |
| 前端页面 | 7 | **7** ✅ | 0 |
| 前端功能点 | ~35 | **35** ✅ | 0 |

> 前端的全部功能均可正常运行。后端只需在空壳 Controller 中填入 MyBatis-Plus CRUD 代码，前端 `api.js` 把 `useMock()` 替换为 `apiPost()` 即可完成对接。

---

## 本次整合改版记录

### v2.3 — 对接数据库 schema（2026-06-11）

- ✅ 复制 `database/` 目录到项目根（5个SQL + 测试数据 + 设计文档 + 查询脚本）
- ✅ `mock-data.js` 全面对齐数据库 10 张表结构：
  - 新增 `Author`（15位）/ `Publisher`（8家）实体
  - `Category` 从字符串数组升级为 `{category_id, category_name, description}` 对象数组
  - 读者类型：`学生`→`本科生`，新增研究生/校外人员
  - 系统用户：新增 reader_id 外键关联，20 条完整测试账号
  - 借阅记录从 3 条扩充到 30 条，覆盖本科生/研究生/教师/校外人员 4 种类型
- ✅ admin.html 规则面板新增读者类型选择器，支持 4 种规则独立编辑
- ✅ readers.html 读者类型下拉改为：本科生/研究生/教师/校外人员
- ✅ login.html 示例账号同步为数据库中的真实账号
- ✅ README.md 新增数据库模块说明 + 全链路实现状态总览

### v2.2 — 用户注册 + 邀请码（2026-06-11）

- ✅ login.html 新增登录/注册双表单切换
- ✅ 读者注册无需邀请码，管理员注册必须输入有效邀请码
- ✅ admin.html 新增邀请码管理面板（生成/吊销/查看使用量）
- ✅ `mock-data.js` 新增 InviteCode 存储 + 校验 + 消费逻辑
- ✅ 邀请码动态管理，不再硬编码在源码中

### v2.1 — 初始整合（2026-06-11）

- ✅ 基于前端A的深绿侧边栏配色，B的多页面架构
- ✅ 7个HTML页面全部重写，script.js 完全重写
- ✅ 新建 `js/api.js`（API服务层）+ `js/mock-data.js`（Mock数据层）
- ✅ 三级角色权限隔离：侧边栏动态渲染 + 页面访问拦截 + 页面内按钮差异化
- ✅ 从A移植：4指标仪表盘、待办列表（可点击跳转）、罚款记录表、逾期催还名单、柱状图统计、快速借阅表单、规则摘要
- ✅ 借阅模块 4 个 API 已对接后端：`/bookadmin/borrow` lend / return / renew / notify
- ✅ 未实现接口自动回退 mock 数据，不影响演示
