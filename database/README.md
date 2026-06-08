# 📚 图书管理系统 - 数据库设计文件

本目录存放图书管理系统的全部数据库设计文件，供**前后端开发**和**实验报告撰写**的同学参考。

---

## 📁 目录结构

```
database/
├── README.md                ← 本文件（使用说明）
├── sql/                     ← 建表语句（按顺序执行）
│   ├── 01_图书模块_建表.sql    ← Author, Book, Category, Publisher 四张表
│   ├── 02_借阅模块_建表.sql    ← Reader, Rule, BorrowRecord, Fine 四张表
│   └── 03_罚款触发器.sql       ← 逾期归还自动生成罚款的触发器
├── data/                    ← 测试数据
│   ├── 04_全部插入数据.sql     ← 全部表的插入数据
│   └── 字段查询结果.xls        ← 各表字段结构导出（报告可直接引用）
├── query/                   ← 查询脚本
│   ├── 05_展示查询.sql        ← 答辩演示用查询（含统计报表）
│   └── 06_字段查询.sql        ← 查询所有表的字段信息（生成报告用）
└── design/                  ← 设计文档
    ├── 图书管理系统总E-R图.drawio  ← 完整系统E-R图
    └── 借阅系统数据库设计.md       ← 借阅模块设计文档（含范式分析）
```

---

## 🚀 快速开始：如何搭建数据库

### 环境要求

- MySQL 8.0+
- 推荐工具：Navicat / DataGrip / MySQL Workbench / 命令行

### 执行顺序（严格按序号）

```
1. 执行 sql/01_图书模块_建表.sql      → 创建 Author, Book, Category, Publisher
2. 执行 sql/02_借阅模块_建表.sql      → 创建 Reader, Rule, BorrowRecord, Fine
3. 执行 sql/03_罚款触发器.sql         → 创建自动罚款触发器
4. 执行 data/04_全部插入数据.sql      → 插入全部测试数据
5. 执行 query/05_展示查询.sql        → 验证数据（可选，答辩演示用）
```

> ⚠️ **注意**：建表有外键依赖，必须按顺序执行。先建图书模块，再建借阅模块。

### 数据库名称

请先手动创建数据库：

```sql
CREATE DATABASE 借阅系统数据库 DEFAULT CHARSET utf8mb4;
```

---

## 📖 各文件详细说明

### sql/01_图书模块_建表.sql

| 信息 | 说明 |
|------|------|
| 内容 | 创建图书相关的 4 张基础表 |
| 包含表 | `Author`（作者）、`Book`（图书）、`Category`（分类）、`Publisher`（出版社） |
| 导出工具 | Navicat Premium |
| 注意 | 脚本开头有 `DROP TABLE IF EXISTS`，重复执行会清空数据 |

### sql/02_借阅模块_建表.sql

| 信息 | 说明 |
|------|------|
| 内容 | 创建借阅相关的 4 张业务表 |
| 包含表 | `Reader`（读者）、`Rule`（借阅规则）、`BorrowRecord`（借阅记录）、`Fine`（罚款） |
| 外键依赖 | `BorrowRecord.book_id` 引用 `Book` 表（需先执行 01） |

### sql/03_罚款触发器.sql

| 信息 | 说明 |
|------|------|
| 内容 | `AFTER UPDATE` 触发器，归还图书时自动计算罚款 |
| 触发条件 | `return_date` 从 NULL 变为非 NULL，且 `overdue_days > 0` |
| 计算公式 | 罚款金额 = 逾期天数 × 每日罚款费用（从 Rule 表读取） |

### data/04_全部插入数据.sql

| 信息 | 说明 |
|------|------|
| 内容 | 8 张表的完整测试数据 |
| 数据量 | 15位作者、8家出版社、8个分类、10本图书、4条规则、20位读者、30条借阅记录、6条罚款 |
| 特点 | 真实图书/作者名，覆盖正常借还、续借、逾期、未还等场景 |
| 注意 | 如已创建触发器，逾期归还会自动生成罚款，避免与手动插入的数据冲突 |

### query/05_展示查询.sql

| 信息 | 说明 |
|------|------|
| 内容 | 答辩演示用的完整查询脚本 |
| 包含 | 基础查询、借阅记录、逾期查询、罚款明细、热门图书TOP5、月度统计、逾期率分析 |
| 亮点 | 续借操作演示 + 归还操作 + 触发器自动罚款演示 |

### query/06_字段查询.sql

| 信息 | 说明 |
|------|------|
| 内容 | 查询 `INFORMATION_SCHEMA.COLUMNS` 获取表结构 |
| 用途 | 生成报告中的"表结构说明"章节 |
| 输出 | 表名、字段名、数据类型、是否为空、键类型、默认值、额外属性 |

### data/字段查询结果.xls

| 信息 | 说明 |
|------|------|
| 内容 | 字段查询导出的 Excel 结果 |
| 用途 | 报告中可直接复制粘贴表结构，无需再跑SQL |
| 打开方式 | Microsoft Excel / WPS |

### design/图书管理系统总E-R图.drawio

| 信息 | 说明 |
|------|------|
| 内容 | 完整系统 E-R 图，包含全部 8 张表及关系 |
| 格式 | draw.io XML |
| 打开方式 | 见下方 |

### design/借阅系统数据库设计.md

| 信息 | 说明 |
|------|------|
| 内容 | 借阅模块完整设计文档 |
| 包含 | E-R图、关系模式、建表语句、业务SQL、触发器、范式分析（3NF） |
| 打开方式 | GitHub 直接预览 / VS Code |

---

## 🛠️ 文件打开方式

### .sql 文件

| 工具 | 操作 |
|------|------|
| **Navicat** | 连接数据库 → 右键数据库 → "运行SQL文件" |
| **DataGrip** | 打开文件 → 选择数据源 → Ctrl+Enter 执行 |
| **MySQL Workbench** | File → Open SQL Script → 执行 |
| **命令行** | `mysql -u root -p 借阅系统数据库 < 文件名.sql` |
| **VS Code** | 安装 MySQL 插件后可直接执行 |

### .drawio 文件（E-R图）

| 方式 | 操作 |
|------|------|
| **在线（推荐）** | 访问 [draw.io](https://app.diagrams.net/) → "打开现有图表" → 上传文件 |
| **VS Code** | 安装 `Draw.io Integration` 插件，双击打开 |
| **桌面版** | 下载 [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases) |
| **导出PNG** | 打开后 File → Export as → PNG（放入报告） |

### .xls 文件

| 工具 | 操作 |
|------|------|
| **Excel** | 双击直接打开 |
| **WPS** | 双击直接打开 |
| **Google Sheets** | 上传 Google Drive 后在线查看 |

### .md 文件

| 工具 | 操作 |
|------|------|
| **GitHub** | 推送后网页直接渲染 |
| **VS Code** | Ctrl+Shift+V 预览 |
| **Typora** | 所见即所得编辑 |

---

## 👥 分工参考

| 角色 | 关注文件 |
|------|----------|
| 写报告的同学 | `design/` 全部 + `data/字段查询结果.xls` + 各 SQL 文件截图 |
| 后端开发 | `sql/` 全部（对照表结构写 Entity 和 Repository） |
| 前端开发 | 参考下方表结构设计页面和接口 |

---

## 🔗 数据库表一览（共 8 张）

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| `Author` | 作者 | author_id, author_name, country |
| `Publisher` | 出版社 | publisher_id, publisher_name, address, phone |
| `Category` | 分类 | category_id, category_name, description |
| `Book` | 图书 | book_id, isbn, book_name, price, total_count, available_count, status |
| `Reader` | 读者 | reader_id, reader_name, reader_type, status |
| `Rule` | 借阅规则 | rule_id, reader_type, max_borrow_days, fine_per_day |
| `BorrowRecord` | 借阅记录 | borrow_id, reader_id, book_id, borrow_date, due_date, borrow_status |
| `Fine` | 罚款 | fine_id, borrow_id, fine_amount, is_paid |

---

## 💡 后端开发建议

基于表结构，建议实现以下 REST API：

- `GET/POST /api/books` — 图书 CRUD
- `GET/POST /api/readers` — 读者 CRUD
- `POST /api/borrow` — 借书
- `POST /api/return` — 还书（触发器自动处理罚款）
- `POST /api/renew` — 续借
- `GET /api/fines` — 罚款查询

> 后端 Spring Boot 项目已在仓库根目录，可直接对接。
