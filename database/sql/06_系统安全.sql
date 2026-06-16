-- =============================================
-- 系统安全设计
-- 包含：CHECK约束、数据库用户权限（GRANT/REVOKE）、审计日志
-- 前置依赖：先执行 01 ~ 05
-- =============================================

USE library_db;

-- =============================================
-- 一、CHECK 约束（数据完整性加固）
-- =============================================

-- 角色合法值约束
ALTER TABLE `User`
    ADD CONSTRAINT chk_user_role
    CHECK (role IN ('系统管理员', '图书管理员', '读者'));

ALTER TABLE InviteCode
    ADD CONSTRAINT chk_invite_role
    CHECK (role IN ('系统管理员', '图书管理员', '读者'));

-- 图书库存非负约束
ALTER TABLE Book
    ADD CONSTRAINT chk_available_count
    CHECK (available_count >= 0);

ALTER TABLE Book
    ADD CONSTRAINT chk_total_count
    CHECK (total_count >= 0);

-- 读者性别约束
ALTER TABLE Reader
    ADD CONSTRAINT chk_reader_gender
    CHECK (gender IN ('男', '女'));

-- 读者状态约束
ALTER TABLE Reader
    ADD CONSTRAINT chk_reader_status
    CHECK (status IN ('正常', '挂失', '注销'));

-- 借阅状态约束
ALTER TABLE BorrowRecord
    ADD CONSTRAINT chk_borrow_status
    CHECK (borrow_status IN ('借阅中', '已归还', '逾期'));

-- 罚款金额正数约束
ALTER TABLE Fine
    ADD CONSTRAINT chk_fine_amount
    CHECK (fine_amount > 0);

-- =============================================
-- 二、数据库用户与权限控制（GRANT/REVOKE）
-- =============================================

-- 2.1 创建三个数据库用户（对应三种角色）
CREATE USER IF NOT EXISTS 'lib_admin'@'localhost' IDENTIFIED BY 'Admin@2026secure';
CREATE USER IF NOT EXISTS 'lib_staff'@'localhost' IDENTIFIED BY 'Staff@2026secure';
CREATE USER IF NOT EXISTS 'lib_reader'@'localhost' IDENTIFIED BY 'Reader@2026secure';

-- 2.2 系统管理员：拥有该数据库的全部权限
GRANT ALL PRIVILEGES ON library_db.* TO 'lib_admin'@'localhost';

-- 2.3 图书管理员：可操作图书和借阅业务，不能管理用户和邀请码
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.Book TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.Author TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.Publisher TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON library_db.Category TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE ON library_db.BorrowRecord TO 'lib_staff'@'localhost';
GRANT SELECT, UPDATE ON library_db.Fine TO 'lib_staff'@'localhost';
GRANT SELECT ON library_db.Reader TO 'lib_staff'@'localhost';
GRANT SELECT ON library_db.Rule TO 'lib_staff'@'localhost';
-- 允许调用业务存储过程
GRANT EXECUTE ON PROCEDURE library_db.sp_borrow_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE library_db.sp_return_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE library_db.sp_renew_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE library_db.sp_pay_fine TO 'lib_staff'@'localhost';

-- 2.4 读者：只能查看图书信息、查看自身借阅、调用借书/续借
GRANT SELECT ON library_db.Book TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.Author TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.Publisher TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.Category TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.BorrowRecord TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.Fine TO 'lib_reader'@'localhost';
GRANT SELECT ON library_db.Rule TO 'lib_reader'@'localhost';
-- 允许调用有限的存储过程
GRANT EXECUTE ON PROCEDURE library_db.sp_borrow_book TO 'lib_reader'@'localhost';
GRANT EXECUTE ON PROCEDURE library_db.sp_renew_book TO 'lib_reader'@'localhost';

-- 2.5 刷新权限
FLUSH PRIVILEGES;

-- =============================================
-- 三、审计日志表 + 触发器
-- =============================================

-- 3.1 审计日志表
CREATE TABLE IF NOT EXISTS AuditLog (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    operation_type VARCHAR(30) NOT NULL COMMENT '操作类型：借书/还书/续借/缴费/用户创建/密码修改',
    operator_table VARCHAR(50) NOT NULL COMMENT '操作涉及的表',
    target_id INT COMMENT '被操作记录的主键ID',
    detail TEXT COMMENT '操作详情（JSON格式）',
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_type (operation_type),
    INDEX idx_audit_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3.2 审计触发器：记录借书操作
DELIMITER $$

CREATE TRIGGER trg_audit_borrow
AFTER INSERT ON BorrowRecord
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (operation_type, operator_table, target_id, detail)
    VALUES ('借书', 'BorrowRecord', NEW.borrow_id,
            JSON_OBJECT('reader_id', NEW.reader_id,
                        'book_id', NEW.book_id,
                        'borrow_date', NEW.borrow_date,
                        'due_date', NEW.due_date));
END$$

-- 3.3 审计触发器：记录还书操作
CREATE TRIGGER trg_audit_return
AFTER UPDATE ON BorrowRecord
FOR EACH ROW
BEGIN
    IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
        INSERT INTO AuditLog (operation_type, operator_table, target_id, detail)
        VALUES ('还书', 'BorrowRecord', NEW.borrow_id,
                JSON_OBJECT('reader_id', NEW.reader_id,
                            'book_id', NEW.book_id,
                            'return_date', NEW.return_date,
                            'overdue_days', NEW.overdue_days));
    END IF;

    -- 记录续借操作
    IF OLD.is_renewed = FALSE AND NEW.is_renewed = TRUE THEN
        INSERT INTO AuditLog (operation_type, operator_table, target_id, detail)
        VALUES ('续借', 'BorrowRecord', NEW.borrow_id,
                JSON_OBJECT('reader_id', NEW.reader_id,
                            'book_id', NEW.book_id,
                            'new_due_date', NEW.due_date));
    END IF;
END$$

-- 3.4 审计触发器：记录缴费操作
CREATE TRIGGER trg_audit_pay_fine
AFTER UPDATE ON Fine
FOR EACH ROW
BEGIN
    IF OLD.is_paid = FALSE AND NEW.is_paid = TRUE THEN
        INSERT INTO AuditLog (operation_type, operator_table, target_id, detail)
        VALUES ('缴费', 'Fine', NEW.fine_id,
                JSON_OBJECT('borrow_id', NEW.borrow_id,
                            'fine_amount', NEW.fine_amount,
                            'pay_date', NEW.pay_date));
    END IF;
END$$

-- 3.5 审计触发器：记录用户创建
CREATE TRIGGER trg_audit_user_create
AFTER INSERT ON `User`
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (operation_type, operator_table, target_id, detail)
    VALUES ('用户创建', 'User', NEW.user_id,
            JSON_OBJECT('username', NEW.username,
                        'role', NEW.role));
END$$

DELIMITER ;
