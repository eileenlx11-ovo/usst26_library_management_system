-- =============================================
-- 系统安全设计
-- 包含：密码加密（SHA2 + salt）、CHECK约束、
--       数据库用户权限（GRANT/REVOKE）、审计日志
-- 前置依赖：先执行 01 ~ 05
-- =============================================

USE 借阅系统数据库;

-- =============================================
-- 一、密码加密改造（SHA2 + Salt）
-- =============================================

-- 1.1 为 User 表添加 salt 字段
ALTER TABLE `User` ADD COLUMN salt VARCHAR(32) DEFAULT NULL COMMENT '密码盐值' AFTER password;

-- 1.2 密码加密函数：生成随机盐 + SHA2 哈希
DELIMITER $$

CREATE FUNCTION fn_generate_salt()
RETURNS VARCHAR(32)
DETERMINISTIC NO SQL
BEGIN
    RETURN LEFT(MD5(RAND()), 16);
END$$

CREATE FUNCTION fn_hash_password(p_password VARCHAR(255), p_salt VARCHAR(32))
RETURNS VARCHAR(255)
DETERMINISTIC NO SQL
BEGIN
    RETURN SHA2(CONCAT(p_salt, p_password, p_salt), 256);
END$$

DELIMITER ;

-- 1.3 将现有明文密码迁移为加密存储
-- 为每个用户生成 salt 并更新密码哈希
UPDATE `User`
SET salt = fn_generate_salt()
WHERE salt IS NULL;

UPDATE `User`
SET password = fn_hash_password(password, salt)
WHERE LENGTH(password) < 64;  -- 仅处理未加密的（SHA256 输出为64位hex）

-- 1.4 修改注册存储过程，使用加密密码
DROP PROCEDURE IF EXISTS sp_register_user;

DELIMITER $$

CREATE PROCEDURE sp_register_user(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_invite_code VARCHAR(32),
    IN p_reader_name VARCHAR(50),
    IN p_gender VARCHAR(10),
    IN p_phone VARCHAR(20),
    IN p_reader_type VARCHAR(20)
)
BEGIN
    DECLARE v_code_id INT;
    DECLARE v_role VARCHAR(20);
    DECLARE v_new_user_id INT;
    DECLARE v_new_reader_id INT DEFAULT NULL;
    DECLARE v_salt VARCHAR(32);

    -- 错误处理：回滚事务
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '注册失败，事务已回滚';
    END;

    START TRANSACTION;

    -- 1. 验证邀请码：必须存在、未使用、未过期
    SELECT code_id, role
    INTO v_code_id, v_role
    FROM InviteCode
    WHERE code = p_invite_code
      AND is_used = FALSE
      AND expire_time > NOW()
    LIMIT 1;

    IF v_code_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '邀请码无效、已使用或已过期';
    END IF;

    -- 2. 检查用户名是否已存在
    IF EXISTS (SELECT 1 FROM `User` WHERE username = p_username) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = '用户名已存在';
    END IF;

    -- 3. 如果是读者角色，先创建 Reader 记录
    IF v_role = '读者' THEN
        INSERT INTO Reader (reader_name, gender, phone, reader_type, register_date, status)
        VALUES (p_reader_name, p_gender, p_phone,
                IFNULL(p_reader_type, '本科生'), CURDATE(), '正常');

        SET v_new_reader_id = LAST_INSERT_ID();
    END IF;

    -- 4. 生成盐值并加密密码
    SET v_salt = fn_generate_salt();

    -- 5. 插入 User 记录（密码加密存储）
    INSERT INTO `User` (username, password, salt, role, reader_id, create_time, is_active)
    VALUES (p_username, fn_hash_password(p_password, v_salt), v_salt,
            v_role, v_new_reader_id, NOW(), TRUE);

    SET v_new_user_id = LAST_INSERT_ID();

    -- 6. 标记邀请码已使用
    UPDATE InviteCode
    SET is_used = TRUE,
        used_by = v_new_user_id
    WHERE code_id = v_code_id;

    COMMIT;

    -- 返回注册结果
    SELECT v_new_user_id AS user_id,
           p_username AS username,
           v_role AS role,
           v_new_reader_id AS reader_id,
           '注册成功' AS result;
END$$

DELIMITER ;

-- 1.5 登录验证存储过程
DELIMITER $$

CREATE PROCEDURE sp_login(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255),
    OUT p_result VARCHAR(100),
    OUT p_user_id INT,
    OUT p_role VARCHAR(20)
)
BEGIN
    DECLARE v_stored_hash VARCHAR(255);
    DECLARE v_salt VARCHAR(32);
    DECLARE v_is_active BOOLEAN;

    SELECT user_id, password, salt, role, is_active
    INTO p_user_id, v_stored_hash, v_salt, p_role, v_is_active
    FROM `User`
    WHERE username = p_username;

    IF p_user_id IS NULL THEN
        SET p_result = '失败：用户不存在';
    ELSEIF v_is_active = FALSE THEN
        SET p_result = '失败：账户已禁用';
        SET p_user_id = NULL;
    ELSEIF v_stored_hash != fn_hash_password(p_password, v_salt) THEN
        SET p_result = '失败：密码错误';
        SET p_user_id = NULL;
    ELSE
        -- 更新最后登录时间
        UPDATE `User` SET last_login = NOW() WHERE user_id = p_user_id;
        SET p_result = '登录成功';
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 二、CHECK 约束（数据完整性加固）
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
-- 三、数据库用户与权限控制（GRANT/REVOKE）
-- =============================================

-- 3.1 创建三个数据库用户（对应三种角色）
CREATE USER IF NOT EXISTS 'lib_admin'@'localhost' IDENTIFIED BY 'Admin@2026secure';
CREATE USER IF NOT EXISTS 'lib_staff'@'localhost' IDENTIFIED BY 'Staff@2026secure';
CREATE USER IF NOT EXISTS 'lib_reader'@'localhost' IDENTIFIED BY 'Reader@2026secure';

-- 3.2 系统管理员：拥有该数据库的全部权限
GRANT ALL PRIVILEGES ON 借阅系统数据库.* TO 'lib_admin'@'localhost';

-- 3.3 图书管理员：可操作图书和借阅业务，不能管理用户和邀请码
GRANT SELECT, INSERT, UPDATE, DELETE ON 借阅系统数据库.Book TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON 借阅系统数据库.Author TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON 借阅系统数据库.Publisher TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON 借阅系统数据库.Category TO 'lib_staff'@'localhost';
GRANT SELECT, INSERT, UPDATE ON 借阅系统数据库.BorrowRecord TO 'lib_staff'@'localhost';
GRANT SELECT, UPDATE ON 借阅系统数据库.Fine TO 'lib_staff'@'localhost';
GRANT SELECT ON 借阅系统数据库.Reader TO 'lib_staff'@'localhost';
GRANT SELECT ON 借阅系统数据库.Rule TO 'lib_staff'@'localhost';
-- 允许调用业务存储过程
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_borrow_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_return_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_renew_book TO 'lib_staff'@'localhost';
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_pay_fine TO 'lib_staff'@'localhost';

-- 3.4 读者：只能查看图书信息、查看自身借阅、调用借书/续借
GRANT SELECT ON 借阅系统数据库.Book TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.Author TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.Publisher TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.Category TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.BorrowRecord TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.Fine TO 'lib_reader'@'localhost';
GRANT SELECT ON 借阅系统数据库.Rule TO 'lib_reader'@'localhost';
-- 允许调用有限的存储过程
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_borrow_book TO 'lib_reader'@'localhost';
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_renew_book TO 'lib_reader'@'localhost';
GRANT EXECUTE ON PROCEDURE 借阅系统数据库.sp_login TO 'lib_reader'@'localhost';

-- 3.5 刷新权限
FLUSH PRIVILEGES;

-- =============================================
-- 四、审计日志表 + 触发器
-- =============================================

-- 4.1 审计日志表
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

-- 4.2 审计触发器：记录借书操作
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

-- 4.3 审计触发器：记录还书操作
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

-- 4.4 审计触发器：记录缴费操作
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

-- 4.5 审计触发器：记录用户创建
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
