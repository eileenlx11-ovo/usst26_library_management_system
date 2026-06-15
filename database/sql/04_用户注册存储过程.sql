-- =============================================
-- 用户注册存储过程
-- 事务逻辑：验证邀请码 → 插入 User → 标记邀请码已用
--           → 如果是读者则同时创建 Reader 记录
-- =============================================

USE library_db;

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

    -- 4. 插入 User 记录
    INSERT INTO `User` (username, password, role, reader_id, create_time, is_active)
    VALUES (p_username, p_password, v_role, v_new_reader_id, NOW(), TRUE);

    SET v_new_user_id = LAST_INSERT_ID();

    -- 5. 标记邀请码已使用
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
