# 📚 图书管理系统 — 数据库模块

数据库原理课程大作业 · 数据库设计与实现

---

## 📁 目录结构

```
database/
├── README.md                      ← 本文件
├── sql/                           ← 建表与逻辑对象（按顺序执行）
│   ├── 01_图书模块_建表.sql         ← Author, Publisher, Category, Book
│   ├── 02_借阅模块_建表.sql         ← Reader, Rule, BorrowRecord, Fine, User, InviteCode + 索引
│   ├── 03_罚款触发器.sql            ← 触发器（逾期自动罚款 + 库存自动增减）
│   ├── 04_用户注册存储过程.sql       ← sp_register_user（邀请码验证 + 事务注册）
│   ├── 05_视图与存储过程.sql         ← 5 个视图 + 4 个存储过程（借/还/续/缴罚款）
│   ├── 06_系统安全.sql              ← 🆕 密码加密 + 权限控制 + CHECK约束 + 审计日志
│   └── 07_并发控制.sql              ← 🆕 悲观锁 + 事务 + 死锁处理
├── data/                          ← 测试数据
│   ├── 04_全部插入数据.sql          ← 10 张表完整测试数据
│   ├── user表字段查询.xls           ← User 表字段导出
│   └── 字段查询结果.xls             ← 各表字段结构导出（报告可直接引用）
├── query/                         ← 查询脚本
│   ├── 05_展示查询.sql             ← 答辩演示（统计报表 + 视图 + 存储过程调用）
│   └── 06_字段查询.sql             ← 查询 INFORMATION_SCHEMA 生成字段报告
└── design/                        ← 设计文档
    ├── 系统数据库设计.md            ← 关系模式 + 范式分析 + 外键关系 + 索引设计
    └── 图书管理系统总E-R图.drawio   ← 完整系统 E-R 图
```

---

## 🚀 快速开始

### 环境要求

- MySQL 8.0+
- 字符集：utf8mb4
- 推荐工具：Navicat / DataGrip / MySQL Workbench

### 执行顺序（严格按序号）

```sql
-- 1. 建表
source sql/01_图书模块_建表.sql      -- Author, Publisher, Category, Book
source sql/02_借阅模块_建表.sql      -- Reader, Rule, BorrowRecord, Fine, User, InviteCode + 索引

-- 2. 插入测试数据
source data/04_全部插入数据.sql

-- 3. 创建触发器
source sql/03_罚款触发器.sql

-- 4. 创建视图 + 存储过程
source sql/05_视图与存储过程.sql

-- 5. 创建注册存储过程
source sql/04_用户注册存储过程.sql

-- 6. 系统安全（密码加密 + 权限 + 审计）
source sql/06_系统安全.sql

-- 7. 并发控制（重写存储过程为事务安全版本）
source sql/07_并发控制.sql

-- 8. 运行演示查询（答辩用）
source query/05_展示查询.sql
```

---

## 📊 数据库表概览（10 张表）

| 表名 | 说明 | 记录数 |
|------|------|--------|
| Author | 作者信息 | 15 |
| Publisher | 出版社信息 | 8 |
| Category | 图书分类 | 8 |
| Book | 图书信息 | 10 |
| Reader | 读者信息 | 20 |
| User | 系统用户（登录认证） | 20 |
| InviteCode | 邀请码（注册权限控制） | — |
| Rule | 借阅规则 | 4 |
| BorrowRecord | 借阅记录 | 30 |
| Fine | 罚款记录 | 6 |

---

## 🔑 User 表设计

```sql
CREATE TABLE User (
    user_id     INT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL,          -- 系统管理员/图书管理员/读者
    reader_id   INT DEFAULT NULL,              -- 读者角色关联 Reader 表
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login  DATETIME,
    is_active   BOOLEAN DEFAULT TRUE
);
```

支持三种角色：系统管理员、图书管理员、读者。读者用户通过 `reader_id` 外键关联 Reader 表。

---

## ⚡ 触发器

| 触发器 | 触发时机 | 功能 |
|--------|----------|------|
| trg_overdue_fine | 归还时 (BEFORE UPDATE) | 逾期自动生成罚款记录 |
| trg_borrow_decrease_stock | 借出时 (AFTER INSERT) | 可借册数 -1 |
| trg_return_increase_stock | 归还时 (AFTER UPDATE) | 可借册数 +1 |

---

## 📈 存储过程

| 存储过程 | 功能 | 定义位置 |
|----------|------|----------|
| sp_borrow_book | 借阅图书（校验状态+库存+上限） | 05_视图与存储过程.sql |
| sp_return_book | 归还图书（计算逾期，触发器自动罚款） | 05_视图与存储过程.sql |
| sp_renew_book | 续借图书（校验是否已续借） | 05_视图与存储过程.sql |
| sp_pay_fine | 缴纳罚款 | 05_视图与存储过程.sql |
| sp_register_user | 用户注册（邀请码验证+事务） | 04_用户注册存储过程.sql |

---

## 👁️ 视图

| 视图 | 用途 |
|------|------|
| v_current_borrow | 当前借阅中的记录（含剩余天数） |
| v_overdue_readers | 逾期读者名单（含预计罚款） |
| v_book_borrow_stats | 图书借阅统计（累计借阅/在借/逾期） |
| v_reader_summary | 读者借阅概况（在借数/逾期数/未缴罚款） |
| v_fine_detail | 罚款明细（含读者/图书/金额/状态） |

---

## 📝 与上一版的变化

- **新增 User 表**：统一登录认证，支持三级角色
- **新增 InviteCode 表**：邀请码注册机制，防止任意注册管理员
- **新增 sp_register_user**：注册事务（验证邀请码 → 创建用户 → 标记已用）
- **新增 5 个视图**：当前借阅、逾期读者、图书统计、读者概况、罚款明细
- **新增 4 个存储过程**：借/还/续/缴罚款，含完整错误处理
- **新增 9 个索引**：借阅记录、读者类型、罚款状态、用户角色、邀请码等
- **新增库存触发器**：借出/归还自动维护可借册数
- **新增设计文档**：关系模式、范式分析、外键关系图、索引设计说明
- 原有 8 张表的建表语句和数据不变

---

## 🆕 本次新增：系统安全 + 并发控制

### 06_系统安全.sql

| 功能 | 说明 |
|------|------|
| 密码加密 | `SHA2` + `salt` 盐值，杜绝明文存储；新增 `fn_generate_salt()` / `fn_hash_password()` 函数 |
| 登录验证 | 新增 `sp_login` 存储过程，验证哈希而非明文 |
| CHECK 约束 | role / gender / status / borrow_status / available_count / fine_amount 全部加约束 |
| 数据库用户权限 | 创建 `lib_admin` / `lib_staff` / `lib_reader` 三个 MySQL 用户，按角色 GRANT |
| 审计日志 | `AuditLog` 表 + 4 个触发器自动记录借书/还书/续借/缴费/用户创建 |

### 07_并发控制.sql

| 功能 | 说明 |
|------|------|
| 悲观锁 | 借书时 `SELECT ... FOR UPDATE` 锁住 Book 行，防止同一本书被多人同时借走 |
| 显式事务 | 借/还/续/缴费 四个存储过程全部用 `START TRANSACTION` + `COMMIT`/`ROLLBACK` 包裹 |
| 死锁处理 | `sp_borrow_book_safe` 捕获错误码 1213，自动重试最多 3 次 |
| 演示脚本 | 文件末尾注释中附带死锁复现步骤 + 并发验证用例 |

> ⚠️ **执行顺序**：07 会 `DROP PROCEDURE` 重建四个存储过程（并发安全版），必须在 05、06 之后执行。

---

## 👥 各组员对接说明

### 🖥️ 前端同学

1. **登录接口变化**：密码不再是明文比对，后端需调用 `sp_login(username, password)` 存储过程，前端只需确保密码原文发到后端即可（不需要前端加密）
2. **新增审计日志页面（可选）**：如果要展示操作记录，可以查 `AuditLog` 表，字段有 `operation_type`（操作类型）、`detail`（JSON 格式详情）、`operation_time`
3. **其他接口不变**：借书/还书/续借/缴费的调用方式不变（参数和返回值格式一样），只是后端底层加了并发保护

### ⚙️ 后端同学

1. **数据库连接用户**：不再用 root 连接，按角色使用对应用户：
   - 管理员登录 → 用 `lib_admin`@`localhost`（全部权限）
   - 图书管理员登录 → 用 `lib_staff`@`localhost`（业务操作权限）
   - 读者登录 → 用 `lib_reader`@`localhost`（只读 + 有限存储过程）
2. **登录逻辑**：调用 `CALL sp_login(username, password, @result, @user_id, @role)` 即可完成密码验证 + 最后登录时间更新
3. **注册逻辑**：`sp_register_user` 已自动加盐加密，后端直接传明文密码参数即可
4. **并发安全**：存储过程内部已处理事务和锁，后端不需要额外加 `@Transactional`；如果要额外保险，可以调用 `sp_borrow_book_safe`（带死锁重试）
5. **User 表新增字段**：`salt VARCHAR(32)` — 不需要后端操作，存储过程内部管理

### 📝 实验报告同学

本次新增内容覆盖实验报告中两个重要章节：

**系统安全性设计（建议单独一节）：**
- 密码存储策略：SHA2 + 随机盐值，引用 `fn_hash_password` 代码
- 权限控制：三级 MySQL 用户 + GRANT/REVOKE，画一个权限矩阵表
- 数据完整性：CHECK 约束列表
- 审计追溯：AuditLog 表结构 + 触发器自动记录

**并发控制设计（建议单独一节）：**
- 问题描述：同一本书被两人同时借出的竞态条件
- 解决方案：悲观锁（`SELECT ... FOR UPDATE`）+ 显式事务
- 死锁处理：InnoDB 自动检测 + 应用层重试机制
- 验证方案：引用文件末尾的并发测试用例
- 可以截图 `SHOW ENGINE INNODB STATUS` 的死锁检测输出
