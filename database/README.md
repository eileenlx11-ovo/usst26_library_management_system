# 📚 图书管理系统 — 数据库模块

> 数据库原理课程大作业 · 数据库设计与实现

---

## 📁 目录结构

```
database/
├── README.md                          ← 本文件
├── sql/                               ← 建表与逻辑对象（按序号执行）
│   ├── 01_图书模块_建表.sql             ← Author, Publisher, Category, Book
│   ├── 02_借阅模块_建表.sql             ← Reader, Rule, BorrowRecord, Fine, User, InviteCode + 索引
│   ├── 03_罚款触发器.sql                ← 3个触发器（逾期罚款 + 库存自动增减）
│   ├── 04_用户注册存储过程.sql           ← sp_register_user（事务 + 邀请码验证）
│   ├── 05_视图与存储过程.sql             ← 5个视图 + 4个存储过程（借/还/续/缴）
│   ├── 06_系统安全.sql                  ← 密码加密 + CHECK约束 + GRANT权限 + 审计日志
│   ├── 07_并发控制.sql                  ← 悲观锁 + 事务隔离 + 死锁重试
│   └── 08_同步更新backup触发器.sql       ← 备份库实时同步（10张表×3操作=30个触发器）
├── data/                              ← 测试数据
│   ├── 04_全部插入数据.sql              ← 10张表完整测试数据（共1135条）
│   ├── user表字段查询.xls               ← User 表字段导出
│   └── 字段查询结果.xls                 ← 各表字段结构导出
├── query/                             ← 查询脚本
│   ├── 05_展示查询.sql                 ← 答辩演示（统计报表 + 视图 + 存储过程调用）
│   └── 06_字段查询.sql                 ← INFORMATION_SCHEMA 字段报告
└── design/                            ← 设计文档
    ├── 系统数据库设计.md                ← 关系模式 + 范式分析 + 索引策略 + 大关系存储
    └── 图书管理系统总E-R图.drawio       ← 完整系统 E-R 图
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
source sql/01_图书模块_建表.sql;
source sql/02_借阅模块_建表.sql;

-- 2. 插入测试数据
source data/04_全部插入数据.sql;

-- 3. 触发器 + 存储过程
source sql/03_罚款触发器.sql;
source sql/04_用户注册存储过程.sql;
source sql/05_视图与存储过程.sql;

-- 4. 系统安全（密码加密 + 权限 + 审计，会重建 sp_register_user）
source sql/06_系统安全.sql;

-- 5. 并发控制（重写存储过程为事务安全版本）
source sql/07_并发控制.sql;

-- 6.（可选）备份库同步触发器
--    需先创建备份库：CREATE DATABASE `library_db_backup` DEFAULT CHARSET utf8mb4;
--    并在备份库中执行 01 + 02 的建表语句
source sql/08_同步更新backup触发器.sql;

-- 7. 运行演示查询（答辩用）
source query/05_展示查询.sql;
```

---

## 📊 数据库表概览（10张表）

| 表名 | 说明 | 记录数 | 负责人 |
|------|------|--------|--------|
| Author | 作者信息 | 113 | A |
| Publisher | 出版社信息 | 106 | A |
| Category | 图书分类 | 105 | A |
| Book | 图书信息 | 118 | A |
| Reader | 读者信息 | 120 | B |
| Rule | 借阅规则 | 100 | B |
| BorrowRecord | 借阅记录（大关系） | 150 | B |
| Fine | 罚款记录 | 110 | B |
| User | 系统用户（登录认证） | 130 | B |
| InviteCode | 邀请码（注册权限控制） | 108 | B |

---

## ⚡ 触发器

### 业务触发器（03_罚款触发器.sql）

| 触发器 | 触发时机 | 功能 |
|--------|----------|------|
| `trg_auto_create_fine` | AFTER UPDATE on BorrowRecord | 归还逾期图书时自动生成罚款记录 |
| `trg_borrow_decrease_stock` | AFTER INSERT on BorrowRecord | 借出时 available_count - 1（含 >0 防负数保护） |
| `trg_return_increase_stock` | AFTER UPDATE on BorrowRecord | 归还时 available_count + 1 |

### 审计触发器（06_系统安全.sql）

| 触发器 | 记录内容 |
|--------|----------|
| `trg_audit_borrow` | 借书操作（reader_id, book_id, 日期） |
| `trg_audit_return` | 还书 + 续借操作 |
| `trg_audit_pay_fine` | 缴费操作 |
| `trg_audit_user_create` | 用户创建 |

### 备份同步触发器（08_同步更新backup触发器.sql）

- 10张表 × 3操作（INSERT/UPDATE/DELETE）= **30个触发器**
- 命名：`trg_backup_<表名>_<insert|update|delete>`
- 实时同步主库变更到 `library_db_backup`

---

## 📈 存储过程

| 存储过程 | 功能 | 关键特性 | 定义位置 |
|----------|------|----------|----------|
| `sp_borrow_book` | 借书 | FOR UPDATE 悲观锁 + 事务 + 校验状态/库存/上限 | 07 |
| `sp_return_book` | 还书 | 事务 + 触发器联动（罚款+库存） | 07 |
| `sp_renew_book` | 续借 | FOR UPDATE 防重复续借 | 07 |
| `sp_pay_fine` | 缴罚款 | FOR UPDATE 防重复缴费 | 07 |
| `sp_register_user` | 用户注册 | 事务 + 邀请码 + SHA2密码加密 | 06 |
| `sp_login` | 登录验证 | 盐值哈希比对 + 更新 last_login | 06 |
| `sp_borrow_book_safe` | 借书（安全版） | 捕获死锁错误码1213，自动重试3次 | 07 |

---

## 👁️ 视图（5个）

| 视图 | 用途 |
|------|------|
| `v_current_borrow` | 当前借阅中的记录（含剩余天数、是否续借） |
| `v_overdue_readers` | 逾期读者名单（含联系电话、预计罚款金额） |
| `v_book_borrow_stats` | 图书借阅统计（累计借阅次数/在借数/逾期次数） |
| `v_reader_summary` | 读者借阅概况（在借数/逾期数/历史逾期/未缴罚款） |
| `v_fine_detail` | 罚款明细（读者/图书/金额/缴纳状态） |

---

## 🔒 系统安全（06）

| 机制 | 实现方式 |
|------|----------|
| 密码加密 | SHA2-256 + 随机16位盐值（`fn_generate_salt` + `fn_hash_password`） |
| CHECK 约束 | role / gender / status / borrow_status / available_count / fine_amount |
| 权限隔离 | 3个MySQL用户按最小权限GRANT |
| 审计日志 | AuditLog 表 + 4个触发器自动记录关键操作（JSON详情） |

### 数据库用户权限

| MySQL 用户 | 对应角色 | 权限 |
|------------|----------|------|
| `lib_admin`@localhost | 系统管理员 | ALL PRIVILEGES |
| `lib_staff`@localhost | 图书管理员 | 图书CRUD + 借阅操作 + 业务存储过程 |
| `lib_reader`@localhost | 读者 | 全表SELECT + 借书/续借/登录存储过程 |

---

## 🔄 并发控制（07）

| 策略 | 说明 |
|------|------|
| 悲观锁 | `SELECT ... FOR UPDATE` 锁定目标行，防止超借/重复还书/重复缴费 |
| 显式事务 | 借/还/续/缴费全部 `START TRANSACTION` + `COMMIT`/`ROLLBACK` |
| 死锁处理 | `sp_borrow_book_safe` 捕获错误码 1213，自动重试最多3次 |
| 统一加锁顺序 | Reader → Book → BorrowRecord → Fine，避免交叉等待 |
| 异常兜底 | `EXIT HANDLER FOR SQLEXCEPTION` → ROLLBACK + 返回失败信息 |

---

## 💾 备份同步（08）

- 通过触发器实现主库到备份库的**实时同步**
- 备份库名：`library_db_backup`
- 覆盖所有10张表的 INSERT / UPDATE / DELETE 操作
- 使用前需先创建备份库并建立相同表结构

---

## 👥 分工

| 成员 | 负责表 | SQL对象 | 其他 |
|------|--------|---------|------|
| **A** | Author / Publisher / Category / Book（4张） | 5个视图 + 展示查询脚本 | E-R图（图书部分）+ 范式分析 + 大关系存储策略 |
| **B** | Reader / Rule / BorrowRecord / Fine / User / InviteCode（6张） | 3触发器 + 7存储过程 + 30备份触发器 + 4审计触发器 | E-R图（借阅部分）+ 安全设计 + 并发控制 |

---

## 📝 与前端/后端的对接

### 前端

- 登录接口：前端发送明文密码，后端调用 `sp_login` 做哈希验证
- 借/还/续/缴费接口的参数和返回格式不变，底层已加并发保护
- 审计日志可通过查询 `AuditLog` 表获取操作记录

### 后端

- 按角色使用对应 MySQL 用户连接数据库（最小权限原则）
- 登录：`CALL sp_login(username, password, @result, @user_id, @role)`
- 注册：`CALL sp_register_user(...)` — 内部自动加盐加密
- 存储过程内部已处理事务和锁，后端无需额外 `@Transactional`
- 如需死锁重试保护，调用 `sp_borrow_book_safe` 替代 `sp_borrow_book`
