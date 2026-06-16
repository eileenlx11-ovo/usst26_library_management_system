-- =============================================
-- 借阅模块建表（成员B）
-- 包含：Reader, Rule, BorrowRecord, Fine, User + 索引
-- 前置依赖：先执行 01_图书模块_建表.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS library_db DEFAULT CHARSET utf8mb4;
USE library_db;

-- =============================================
-- 1. 读者表 Reader
-- =============================================
create table Reader (
reader_id int primary key auto_increment,
reader_name varchar(50) not null,
gender varchar (10),
phone varchar(20),
reader_type  varchar(20) not null,
register_date date not null,
status varchar (20) default '正常'
);

-- =============================================
-- 2. 借阅规则表 Rule
-- =============================================
create table Rule(
rule_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_type VARCHAR(20) NOT NULL,
    max_borrow_days INT NOT NULL,
    max_borrow_count INT NOT NULL,
    fine_per_day DECIMAL(10,2) NOT NULL,
    max_renew_times INT NOT NULL,
    renew_days INT NOT NULL
);

-- =============================================
-- 3. 借阅记录表 BorrowRecord
-- =============================================
create table BorrowRecord(
borrow_id int primary key auto_increment,
reader_id int not null,
book_id int not null ,
rule_id int not null,
borrow_date date not null,
due_date date not null,
return_date date,
is_renewed boolean default false,
overdue_days int default 0,
borrow_status varchar(20) default '借阅中',

 CONSTRAINT fk_borrow_reader
        FOREIGN KEY (reader_id)
        REFERENCES Reader(reader_id),

    CONSTRAINT fk_borrow_book
        FOREIGN KEY (book_id)
        REFERENCES Book(book_id),

    CONSTRAINT fk_borrow_rule
        FOREIGN KEY (rule_id)
        REFERENCES Rule(rule_id)

);

-- =============================================
-- 4. 罚款表 Fine
-- =============================================
create table Fine(

fine_id int primary key auto_increment,
borrow_id int not null unique,
fine_amount decimal(10,2) not null,
is_paid boolean default false,
create_date date not null,
pay_date date,

CONSTRAINT fk_fine_borrow
        FOREIGN KEY (borrow_id)
        REFERENCES BorrowRecord(borrow_id)

);

-- =============================================
-- 5. 系统用户表 User（统一登录认证）【新增】
-- 角色：系统管理员 / 图书管理员 / 读者
-- =============================================
CREATE TABLE IF NOT EXISTS `User` (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT '系统管理员/图书管理员/读者',
    reader_id INT DEFAULT NULL COMMENT '读者角色关联Reader表，管理员为NULL',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_user_reader
        FOREIGN KEY (reader_id) REFERENCES Reader(reader_id)
);

-- =============================================
-- 6. 邀请码表 InviteCode（注册权限控制）【新增】
-- 管理员生成邀请码，注册时必须填写正确邀请码才能获得对应角色
-- =============================================
CREATE TABLE IF NOT EXISTS InviteCode (
    code_id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(32) NOT NULL UNIQUE COMMENT '邀请码（UUID或随机字符串）',
    role VARCHAR(20) NOT NULL COMMENT '该邀请码对应的角色：系统管理员/图书管理员/读者',
    created_by INT DEFAULT NULL COMMENT '生成该邀请码的管理员 user_id',
    used_by INT DEFAULT NULL COMMENT '使用该邀请码注册的 user_id',
    is_used BOOLEAN DEFAULT FALSE,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    expire_time DATETIME NOT NULL COMMENT '过期时间',

    CONSTRAINT fk_invite_created_by FOREIGN KEY (created_by) REFERENCES `User`(user_id),
    CONSTRAINT fk_invite_used_by FOREIGN KEY (used_by) REFERENCES `User`(user_id)
);

-- =============================================
-- 7. 索引设计（性能优化）【新增】
-- =============================================

-- 借阅记录表：高频查询字段
CREATE INDEX idx_borrow_reader ON BorrowRecord(reader_id);
CREATE INDEX idx_borrow_book ON BorrowRecord(book_id);
CREATE INDEX idx_borrow_status ON BorrowRecord(borrow_status);
CREATE INDEX idx_borrow_date ON BorrowRecord(borrow_date);

-- 读者表：按类型查询
CREATE INDEX idx_reader_type ON Reader(reader_type);

-- 罚款表：按缴纳状态查询
CREATE INDEX idx_fine_paid ON Fine(is_paid);

-- 用户表：按角色查询
CREATE INDEX idx_user_role ON `User`(role);

-- 邀请码表：按使用状态和过期时间查询
CREATE INDEX idx_invite_used ON InviteCode(is_used);
CREATE INDEX idx_invite_expire ON InviteCode(expire_time);
