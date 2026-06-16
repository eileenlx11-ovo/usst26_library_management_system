# 📚 图书管理系统 — 数据库模块

> 数据库原理课程大作业 · 数据库设计与实现

---

## 📁 目录结构

```
database/
├── README.md                          ← 本文件（项目说明文档）
├── sql/                               ← 建表与逻辑对象（按序号执行）
│   ├── 01_图书模块_建表.sql             ← Author, Publisher, Category, Book
│   ├── 02_借阅模块_建表.sql             ← Reader, Rule, BorrowRecord, Fine, User, InviteCode + 索引
│   ├── 03_罚款触发器.sql                ← 3个触发器（逾期罚款 + 库存自动增减）
│   ├── 04_用户注册存储过程.sql           ← sp_register_user（事务 + 邀请码验证）
│   ├── 05_视图与存储过程.sql             ← 5个视图 + 4个存储过程（借/还/续/缴）
│   ├── 06_系统安全.sql                  ← CHECK约束 + GRANT权限 + 审计日志
│   ├── 07_并发控制.sql                  ← 悲观锁 + 事务隔离 + 死锁重试
│   └── 08_同步更新backup触发器.sql       ← 备份库实时同步（10张表×3操作=30个触发器）
├── data/                              ← 测试数据
│   ├── 04_全部插入数据.sql              ← 10张表完整测试数据（共1160条）
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

-- 4. 系统安全（CHECK约束 + 权限 + 审计）
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
| Fine | 罚款记录 | 26 | B |
| User | 系统用户（登录认证） | 130 | B |
| InviteCode | 邀请码（注册权限控制） | 108 | B |

> 合计 **1076 条**测试数据，覆盖正常、边界、异常等多种场景。

---

## 📋 关系模式与字段定义

### 1. 作者表 Author

```
Author(author_id, author_name, country, introduction)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| author_id | INT | PK, AUTO_INCREMENT | 作者编号 |
| author_name | VARCHAR(100) | NOT NULL | 作者姓名 |
| country | VARCHAR(50) | | 国籍 |
| introduction | TEXT | | 简介 |

### 2. 出版社表 Publisher

```
Publisher(publisher_id, publisher_name, address, phone)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| publisher_id | INT | PK, AUTO_INCREMENT | 出版社编号 |
| publisher_name | VARCHAR(100) | NOT NULL | 出版社名称 |
| address | VARCHAR(200) | | 地址 |
| phone | VARCHAR(20) | | 联系电话 |

### 3. 图书分类表 Category

```
Category(category_id, category_name, description)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| category_id | INT | PK, AUTO_INCREMENT | 分类编号 |
| category_name | VARCHAR(50) | UNIQUE, NOT NULL | 分类名称 |
| description | VARCHAR(255) | | 分类描述 |

### 4. 图书表 Book

```
Book(book_id, isbn, book_name, author_id, category_id, publisher_id, publish_date, price, total_count, available_count, status)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| book_id | INT | PK, AUTO_INCREMENT | 图书编号 |
| isbn | VARCHAR(20) | UNIQUE, NOT NULL | 国际标准书号 |
| book_name | VARCHAR(200) | NOT NULL | 书名 |
| author_id | INT | FK → Author | 作者编号 |
| category_id | INT | FK → Category | 分类编号 |
| publisher_id | INT | FK → Publisher | 出版社编号 |
| publish_date | DATE | | 出版日期 |
| price | DECIMAL(8,2) | | 定价 |
| total_count | INT | NOT NULL, DEFAULT 0 | 馆藏总量 |
| available_count | INT | NOT NULL, DEFAULT 0 | 可借数量 |
| status | VARCHAR(20) | DEFAULT '在馆' | 图书状态 |

### 5. 读者表 Reader

```
Reader(reader_id, reader_name, gender, phone, reader_type, register_date, status)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| reader_id | INT | PK, AUTO_INCREMENT | 读者编号 |
| reader_name | VARCHAR(50) | NOT NULL | 姓名 |
| gender | VARCHAR(10) | | 性别（男/女） |
| phone | VARCHAR(20) | | 联系电话 |
| reader_type | VARCHAR(20) | NOT NULL | 类型（本科生/研究生/教师/校外人员） |
| register_date | DATE | NOT NULL | 注册日期 |
| status | VARCHAR(20) | DEFAULT '正常' | 状态（正常/挂失/注销） |

### 6. 借阅规则表 Rule

```
Rule(rule_id, reader_type, max_borrow_days, max_borrow_count, fine_per_day, max_renew_times, renew_days)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| rule_id | INT | PK, AUTO_INCREMENT | 规则编号 |
| reader_type | VARCHAR(20) | NOT NULL | 适用读者类型 |
| max_borrow_days | INT | NOT NULL | 最长借阅天数 |
| max_borrow_count | INT | NOT NULL | 最大借阅数量 |
| fine_per_day | DECIMAL(10,2) | NOT NULL | 每日逾期罚款 |
| max_renew_times | INT | NOT NULL | 最大续借次数 |
| renew_days | INT | NOT NULL | 续借天数 |

### 7. 借阅记录表 BorrowRecord

```
BorrowRecord(borrow_id, reader_id, book_id, rule_id, borrow_date, due_date, return_date, is_renewed, overdue_days, borrow_status)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| borrow_id | INT | PK, AUTO_INCREMENT | 借阅编号 |
| reader_id | INT | FK → Reader, NOT NULL | 读者编号 |
| book_id | INT | FK → Book, NOT NULL | 图书编号 |
| rule_id | INT | FK → Rule, NOT NULL | 规则编号 |
| borrow_date | DATE | NOT NULL | 借阅日期 |
| due_date | DATE | NOT NULL | 应还日期 |
| return_date | DATE | | 实际归还日期 |
| is_renewed | BOOLEAN | DEFAULT FALSE | 是否已续借 |
| overdue_days | INT | DEFAULT 0 | 逾期天数 |
| borrow_status | VARCHAR(20) | DEFAULT '借阅中' | 状态（借阅中/已归还/逾期） |

### 8. 罚款表 Fine

```
Fine(fine_id, borrow_id, fine_amount, is_paid, create_date, pay_date)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| fine_id | INT | PK, AUTO_INCREMENT | 罚款编号 |
| borrow_id | INT | FK → BorrowRecord, UNIQUE, NOT NULL | 关联借阅记录（一对一） |
| fine_amount | DECIMAL(10,2) | NOT NULL | 罚款金额 |
| is_paid | BOOLEAN | DEFAULT FALSE | 是否已缴纳 |
| create_date | DATE | NOT NULL | 生成日期 |
| pay_date | DATE | | 缴纳日期 |

### 9. 系统用户表 User

```
User(user_id, username, password, role, reader_id, create_time, last_login, is_active)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | INT | PK, AUTO_INCREMENT | 用户编号 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 密码 |
| role | VARCHAR(20) | NOT NULL | 角色（系统管理员/图书管理员/读者） |
| reader_id | INT | FK → Reader, DEFAULT NULL | 关联读者（管理员为NULL） |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| last_login | DATETIME | | 最后登录时间 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |

### 10. 邀请码表 InviteCode

```
InviteCode(code_id, code, role, created_by, used_by, is_used, create_time, expire_time)
```

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| code_id | INT | PK, AUTO_INCREMENT | 邀请码编号 |
| code | VARCHAR(32) | UNIQUE, NOT NULL | 邀请码（随机字符串） |
| role | VARCHAR(20) | NOT NULL | 对应角色（系统管理员/图书管理员/读者） |
| created_by | INT | FK → User, DEFAULT NULL | 生成该邀请码的管理员 user_id |
| used_by | INT | FK → User, DEFAULT NULL | 使用该邀请码注册的 user_id |
| is_used | BOOLEAN | DEFAULT FALSE | 是否已使用 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| expire_time | DATETIME | NOT NULL | 过期时间 |

### 表间外键关系

| 外键 | 来源表.字段 | 目标表.字段 | 关系 |
|------|------------|------------|------|
| fk_book_author | Book.author_id | Author.author_id | 多对一 |
| fk_book_category | Book.category_id | Category.category_id | 多对一 |
| fk_book_publisher | Book.publisher_id | Publisher.publisher_id | 多对一 |
| fk_borrow_reader | BorrowRecord.reader_id | Reader.reader_id | 多对一 |
| fk_borrow_book | BorrowRecord.book_id | Book.book_id | 多对一 |
| fk_borrow_rule | BorrowRecord.rule_id | Rule.rule_id | 多对一 |
| fk_fine_borrow | Fine.borrow_id | BorrowRecord.borrow_id | 一对一 |
| fk_user_reader | User.reader_id | Reader.reader_id | 多对一 |
| fk_invite_created_by | InviteCode.created_by | User.user_id | 多对一 |
| fk_invite_used_by | InviteCode.used_by | User.user_id | 多对一 |

---

## ⚡ 触发器（共 37 个）

### 业务触发器（03_罚款触发器.sql）— 3 个

| 触发器 | 触发时机 | 功能 | 设计说明 |
|--------|----------|------|----------|
| `trg_auto_create_fine` | AFTER UPDATE on BorrowRecord | 归还逾期图书时自动计算并插入罚款记录 | 条件：return_date 从NULL变为非NULL 且 overdue_days > 0；金额 = 逾期天数 × Rule.fine_per_day |
| `trg_borrow_decrease_stock` | BEFORE INSERT on BorrowRecord | 借出时自动扣减 Book.available_count | 使用 BEFORE 而非 AFTER：可在写入前校验库存，不足时 SIGNAL 拒绝 INSERT，避免数据不一致 |
| `trg_return_increase_stock` | BEFORE UPDATE on BorrowRecord | 归还时自动恢复 Book.available_count | 条件：return_date 从NULL变为非NULL；与扣减触发器对称的 BEFORE 设计 |

**执行顺序说明**：还书时 → BEFORE触发器恢复库存 → 执行UPDATE本身 → AFTER触发器计算罚款，三者互不干扰。

### 审计触发器（06_系统安全.sql）— 4 个

| 触发器 | 触发时机 | 记录内容 | 存储格式 |
|--------|----------|----------|----------|
| `trg_audit_borrow` | AFTER INSERT on BorrowRecord | 借书操作：reader_id, book_id, 借阅日期, 到期日期 | JSON |
| `trg_audit_return` | AFTER UPDATE on BorrowRecord | 还书：归还日期+逾期天数；续借：新到期日 | JSON |
| `trg_audit_pay_fine` | AFTER UPDATE on Fine | 缴费：borrow_id, 金额, 缴费日期 | JSON |
| `trg_audit_user_create` | AFTER INSERT on User | 用户创建：用户名, 角色 | JSON |

### 备份同步触发器（08_同步更新backup触发器.sql）— 30 个

- 10张表 × 3操作（INSERT/UPDATE/DELETE）= **30个触发器**
- 命名规范：`trg_backup_<表名>_<insert|update|delete>`
- 功能：任何对主库的数据变更实时同步到 `library_db_backup` 备份库
- 实现方式：在每个触发器中直接操作备份库的对应表，INSERT/UPDATE/DELETE 逐字段同步

---

## 📈 存储过程（共 6 个）

| 存储过程 | 功能 | 入参 | 出参 | 关键特性 | 定义位置 |
|----------|------|------|------|----------|----------|
| `sp_borrow_book` | 借书 | reader_id, book_id, rule_id | p_result | FOR UPDATE 悲观锁 + 事务 + 校验状态/库存/上限 | 07 |
| `sp_return_book` | 还书 | borrow_id | p_result | FOR UPDATE 防重复还书 + 触发器联动（罚款+库存） | 07 |
| `sp_renew_book` | 续借 | borrow_id | p_result | FOR UPDATE 防重复续借 + 单次续借限制 | 07 |
| `sp_pay_fine` | 缴罚款 | fine_id | p_result | FOR UPDATE 防重复缴费 | 07 |
| `sp_register_user` | 用户注册 | username, password, invite_code, reader_name, gender, phone, reader_type | SELECT结果集 | 事务 + 邀请码验证 + 自动创建Reader记录 | 04 |
| `sp_borrow_book_safe` | 借书（死锁安全版） | reader_id, book_id, rule_id | p_result | 封装sp_borrow_book，捕获错误码1213自动重试最多3次 | 07 |

### 存储过程详细说明

#### sp_register_user — 用户注册（04_用户注册存储过程.sql）

用事务保证注册流程的原子性，流程如下：

```
验证邀请码（必须存在、未使用、未过期）
  → 检查用户名唯一
    → 如果是读者角色就先创建 Reader 记录
      → 插入 User 记录
        → 标记邀请码已使用
          → COMMIT
```

任何一步出错都会触发 `EXIT HANDLER` 自动 ROLLBACK，不会出现半成品数据。

**邀请码机制的设计意义**：系统不是开放注册的，必须由管理员事先生成邀请码并发放。邀请码本身绑定了角色，用户拿着读者码只能注册成读者，不能自己提权成管理员，从源头避免了越权问题。

#### sp_borrow_book — 借书（07_并发控制.sql）

```
检查读者状态是否正常
  → SELECT ... FOR UPDATE 锁定图书行
    → 检查库存是否大于 0
      → 检查是否已达借阅上限
        → INSERT 借阅记录
          → 触发器自动扣库存
            → COMMIT
```

#### sp_return_book — 还书（07_并发控制.sql）

```
FOR UPDATE 锁定借阅记录（防止重复还书）
  → 计算逾期天数
    → UPDATE 设置 return_date 和 borrow_status
      → BEFORE 触发器自动恢复库存
        → AFTER 触发器自动生成罚款（如逾期）
          → COMMIT
```

#### sp_renew_book — 续借（07_并发控制.sql）

```
FOR UPDATE 锁定借阅记录（防止并发续借）
  → 检查状态必须为"借阅中"且未续借过
    → 从 Rule 表读取续借天数
      → 延长 due_date
        → 标记 is_renewed = TRUE
          → COMMIT
```

限制：每条借阅记录只能续借一次。

#### sp_pay_fine — 缴费（07_并发控制.sql）

```
FOR UPDATE 锁定罚款记录（防止重复缴费）
  → 检查是否已缴纳
    → 设置 is_paid = TRUE，记录 pay_date
      → COMMIT
```

#### sp_borrow_book_safe — 死锁安全版借书（07_并发控制.sql）

封装 `sp_borrow_book`，专门捕获 MySQL 错误码 1213（死锁），自动重试最多 3 次。大多数情况下用户无感知。

### 存储过程调用示例

```sql
-- 借书
CALL sp_borrow_book(1, 5, 1, @result);
SELECT @result;  -- '成功：借阅完成' 或 '失败：图书无可借库存'

-- 还书
CALL sp_return_book(10, @result);
SELECT @result;  -- '成功：已归还，逾期3天，罚款已自动生成'

-- 续借
CALL sp_renew_book(10, @result);
SELECT @result;  -- '成功：续借15天' 或 '失败：已续借过，不可重复续借'

-- 缴费
CALL sp_pay_fine(3, @result);
SELECT @result;  -- '成功：已缴纳罚款 ¥4.50'

-- 注册（需要有效邀请码）
CALL sp_register_user('newuser', 'mypassword', 'READ-2025-XXXXXXXX',
                      '张三', '男', '13800138000', '本科生');

-- 借书（带死锁自动重试）
CALL sp_borrow_book_safe(1, 5, 1, @result);
SELECT @result;
```

---

## 👁️ 视图（5个）

| 视图 | 用途 | 关联表 | 典型使用场景 |
|------|------|--------|------------|
| `v_current_borrow` | 当前借阅中的记录 | Reader + Book + BorrowRecord | 管理员查看在借情况、读者查看自己的借阅 |
| `v_overdue_readers` | 逾期读者名单 | Reader + Book + BorrowRecord + Rule | 催还提醒、逾期报表 |
| `v_book_borrow_stats` | 图书借阅统计 | Book + Author + BorrowRecord | 热门图书排行、馆藏利用率分析 |
| `v_reader_summary` | 读者借阅概况 | Reader + BorrowRecord + Fine | 读者个人中心、信用评估 |
| `v_fine_detail` | 罚款明细 | Fine + BorrowRecord + Reader + Book | 财务对账、罚款管理 |

### 视图查询示例

```sql
-- 查看当前所有借阅中的记录
SELECT * FROM v_current_borrow;

-- 查看逾期读者及预估罚款
SELECT reader_name, phone, book_name, overdue_days, estimated_fine
FROM v_overdue_readers ORDER BY overdue_days DESC;

-- 查看借阅次数最多的图书
SELECT book_name, author_name, total_borrow_times
FROM v_book_borrow_stats ORDER BY total_borrow_times DESC LIMIT 10;

-- 查看有未缴罚款的读者
SELECT reader_name, reader_type, unpaid_fine
FROM v_reader_summary WHERE unpaid_fine > 0;
```

---

## 🔒 系统安全设计（06_系统安全.sql）

### 一、CHECK 约束 — 数据完整性加固

CHECK 约束在数据库层面限制数据合法性，不管数据从哪个入口写入（存储过程、后端代码、手动SQL），不符合约束一律拒绝：

| 约束名 | 约束表 | 约束内容 | 设计目的 |
|--------|--------|----------|----------|
| `chk_user_role` | User | role IN ('系统管理员','图书管理员','读者') | 防止插入非法角色 |
| `chk_invite_role` | InviteCode | role IN ('系统管理员','图书管理员','读者') | 邀请码角色与User表对齐 |
| `chk_available_count` | Book | available_count >= 0 | 库存不可为负数 |
| `chk_total_count` | Book | total_count >= 0 | 馆藏总量不可为负数 |
| `chk_reader_gender` | Reader | gender IN ('男','女') | 性别规范化 |
| `chk_reader_status` | Reader | status IN ('正常','挂失','注销') | 状态枚举约束 |
| `chk_borrow_status` | BorrowRecord | borrow_status IN ('借阅中','已归还','逾期') | 借阅状态枚举约束 |
| `chk_fine_amount` | Fine | fine_amount > 0 | 罚款金额必须为正数 |

### 二、数据库用户权限控制 — 最小权限原则

创建三个 MySQL 数据库用户，按角色分配最小必要权限：

| MySQL 用户 | 对应角色 | 权限说明 |
|------------|----------|----------|
| `lib_admin`@localhost | 系统管理员 | `ALL PRIVILEGES ON library_db.*` — 可执行所有操作 |
| `lib_staff`@localhost | 图书管理员 | 图书表CRUD + BorrowRecord的SELECT/INSERT/UPDATE + Fine的SELECT/UPDATE + 4个业务存储过程的EXECUTE |
| `lib_reader`@localhost | 读者 | 全表SELECT（只读） + sp_borrow_book/sp_renew_book的EXECUTE |

**权限隔离细节**：

```
lib_staff（图书管理员）:
  ✅ Book/Author/Publisher/Category → SELECT, INSERT, UPDATE, DELETE
  ✅ BorrowRecord → SELECT, INSERT, UPDATE（无DELETE：借阅历史不可删除）
  ✅ Fine → SELECT, UPDATE（无INSERT/DELETE：罚款只能由触发器生成）
  ✅ Reader/Rule → SELECT（只读）
  ✅ sp_borrow_book, sp_return_book, sp_renew_book, sp_pay_fine → EXECUTE
  ❌ User/InviteCode → 无任何权限（账号管理归系统管理员）

lib_reader（读者）:
  ✅ 所有业务表 → SELECT（可查看图书信息、自己的借阅和罚款）
  ✅ sp_borrow_book, sp_renew_book → EXECUTE（可自助借书和续借）
  ❌ 不能直接INSERT/UPDATE/DELETE任何表
  ❌ 不能调用sp_return_book, sp_pay_fine（还书和缴费由管理员操作）
```

**安全意义**：即使后端存在SQL注入漏洞，攻击者通过读者账号连接数据库，也只能执行SELECT查询和有限的存储过程调用，无法删除数据或修改其他用户信息。

### 三、审计日志 — 操作留痕

**AuditLog 表结构**：

| 字段 | 类型 | 说明 |
|------|------|------|
| log_id | INT, PK | 日志编号 |
| operation_type | VARCHAR(30) | 操作类型：借书/还书/续借/缴费/用户创建 |
| operator_table | VARCHAR(50) | 操作涉及的表名 |
| target_id | INT | 被操作记录的主键ID |
| detail | TEXT | 操作详情（JSON格式，便于解析） |
| operation_time | DATETIME | 操作时间（自动记录） |

**审计触发器工作原理**：通过 AFTER 触发器自动记录，应用层无需任何额外代码。所有关键操作（借书、还书、续借、缴费、用户创建）都会自动产生审计记录，不可跳过、不可篡改。

```sql
-- 查看最近的审计日志
SELECT operation_type, detail, operation_time
FROM AuditLog ORDER BY operation_time DESC LIMIT 20;

-- 查看某读者的所有操作记录
SELECT * FROM AuditLog
WHERE JSON_EXTRACT(detail, '$.reader_id') = 5;
```

---

## 🔄 并发控制设计（07_并发控制.sql）

### 一、解决的并发问题

| 问题 | 场景描述 | 后果 |
|------|----------|------|
| 超借 | 最后1本库存，两人同时借 | available_count 变为负数，一本书被借出两次 |
| 重复还书 | 同一记录两个请求同时到达 | 库存加两次，罚款可能生成两条 |
| 重复缴费 | 同一罚款被缴两次 | 财务数据错误 |
| 重复续借 | 并发请求导致续借两次 | due_date 被延长两倍 |

### 二、悲观锁方案（SELECT ... FOR UPDATE）

核心思想：在读取数据时就加排他锁，保证"读取-判断-修改"这个过程中间不会被其他事务插入。

```sql
-- 借书存储过程中的关键代码：
START TRANSACTION;

-- ★ FOR UPDATE 锁定图书行，其他事务尝试借同一本书会被阻塞
SELECT available_count INTO v_available
FROM Book WHERE book_id = p_book_id
FOR UPDATE;

IF v_available <= 0 THEN
    ROLLBACK;  -- 库存不足，回滚释放锁
ELSE
    INSERT INTO BorrowRecord ...;  -- 触发器自动扣库存
    COMMIT;  -- 提交并释放锁
END IF;
```

**效果**：事务A先获得锁 → 读到库存=1 → 借书成功 → COMMIT释放锁 → 事务B获得锁 → 读到库存=0 → 返回"库存不足"。

### 三、显式事务 + 异常处理

```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    SET p_result = '失败：系统异常，请重试';
END;

START TRANSACTION;
-- ... 业务逻辑 ...
COMMIT;
```

所有操作要么全部成功（COMMIT），要么全部撤销（ROLLBACK）。不会出现"记录插入了但库存没扣"的中间状态。

### 四、死锁防范（三层保护）

| 层级 | 策略 | 实现方式 |
|------|------|----------|
| **预防** | 统一加锁顺序 | 所有存储过程按 Reader → Book → BorrowRecord → Fine 固定顺序加锁 |
| **检测** | InnoDB自动检测 | `innodb_deadlock_detect = ON`（默认），检测到死锁立刻回滚一个事务 |
| **恢复** | 自动重试 | `sp_borrow_book_safe` 捕获错误码1213，自动重试最多3次 |

**死锁演示步骤**（答辩用）：

```sql
-- 会话1：锁住书1
START TRANSACTION;
SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;

-- 会话2：锁住书2，再尝试锁书1（被阻塞）
START TRANSACTION;
SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;
SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;  -- ⏳ 等待

-- 回到会话1：尝试锁书2 → 死锁形成
SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;
-- 💥 ERROR 1213: Deadlock found when trying to get lock

-- 查看死锁详情：
SHOW ENGINE INNODB STATUS;
```

### 五、并发控制总结

```
请求到达 → 开启事务 → FOR UPDATE 锁定目标行
    → 其他事务被阻塞等待
        → 校验业务规则
            → 通过 → 执行修改 → COMMIT 释放锁
            → 不通过 → ROLLBACK 释放锁
    → 阻塞的事务获得锁 → 重新读取最新数据 → 继续判断
```

---

## 💾 备份同步（08_同步更新backup触发器.sql）

### 设计思路

通过触发器实现主库到备份库的**实时同步**，相当于一个应用层面的简易主从复制：

- 备份库名：`library_db_backup`
- 覆盖所有 10 张表的 INSERT / UPDATE / DELETE 操作
- 每张表 3 个触发器，共 **30 个触发器**
- 命名规范：`trg_backup_<表名>_<insert|update|delete>`

### 使用前提

```sql
-- 1. 创建备份库
CREATE DATABASE `library_db_backup` DEFAULT CHARSET utf8mb4;

-- 2. 在备份库中创建相同的表结构
USE library_db_backup;
source sql/01_图书模块_建表.sql;
source sql/02_借阅模块_建表.sql;

-- 3. 在主库上安装同步触发器
USE library_db;
source sql/08_同步更新backup触发器.sql;
```

### 同步机制

| 操作 | 触发器行为 |
|------|-----------|
| INSERT | 将 NEW 行的所有字段同步 INSERT 到备份库对应表 |
| UPDATE | 按主键定位备份库中的对应行，UPDATE 为 NEW 值 |
| DELETE | 按主键从备份库中 DELETE 对应行 |

---

## 📐 索引设计

| 索引名 | 所在表 | 索引字段 | 优化场景 |
|--------|--------|----------|----------|
| `idx_borrow_reader` | BorrowRecord | reader_id | 查询读者的借阅记录 |
| `idx_borrow_book` | BorrowRecord | book_id | 查询图书的借阅历史 |
| `idx_borrow_status` | BorrowRecord | borrow_status | 筛选"借阅中"/"逾期"记录 |
| `idx_fine_paid` | Fine | is_paid | 查询未缴罚款 |
| `idx_invite_used` | InviteCode | is_used | 查询可用邀请码 |
| `idx_invite_expire` | InviteCode | expire_time | 过期邀请码清理 |
| `idx_audit_type` | AuditLog | operation_type | 按操作类型筛选日志 |
| `idx_audit_time` | AuditLog | operation_time | 按时间范围查询日志 |

---

## 👥 分工

| 成员 | 负责表 | SQL对象 | 其他 |
|------|--------|---------|------|
| **A** | Author / Publisher / Category / Book（4张） | 5个视图 + 展示查询脚本 | E-R图（图书部分）+ 范式分析 + 大关系存储策略 |
| **B** | Reader / Rule / BorrowRecord / Fine / User / InviteCode（6张） | 3业务触发器 + 6存储过程 + 30备份触发器 + 4审计触发器 | E-R图（借阅部分）+ 安全设计 + 并发控制 |

---
