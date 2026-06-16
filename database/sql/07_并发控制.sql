-- =============================================
-- 并发控制设计
-- 包含：悲观锁（SELECT ... FOR UPDATE）、显式事务、
--       死锁处理演示
-- 前置依赖：先执行 01 ~ 06
-- =============================================

USE library_db;

-- =============================================
-- 一、重写存储过程：加入事务 + 悲观锁
-- =============================================

-- =============================================
-- 1.1 借书存储过程（并发安全版）
-- 核心改动：
--   - START TRANSACTION 包裹全流程
--   - SELECT ... FOR UPDATE 锁定 Book 行，防止同一本书超量借出
--   - 异常时 ROLLBACK
-- =============================================
DROP PROCEDURE IF EXISTS sp_borrow_book;

DELIMITER $$

CREATE PROCEDURE sp_borrow_book(
    IN p_reader_id INT,
    IN p_book_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_reader_status VARCHAR(20);
    DECLARE v_reader_type VARCHAR(20);
    DECLARE v_rule_id INT;
    DECLARE v_available INT;
    DECLARE v_current_count INT;
    DECLARE v_max_count INT;
    DECLARE v_max_days INT;

    -- 死锁/异常处理：捕获错误后回滚
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '失败：系统异常（可能发生死锁），请重试';
    END;

    START TRANSACTION;

    -- 检查读者状态，同时取出 reader_type
    SELECT status, reader_type INTO v_reader_status, v_reader_type
    FROM Reader WHERE reader_id = p_reader_id;

    IF v_reader_status IS NULL THEN
        SET p_result = '失败：读者不存在';
        ROLLBACK;
    ELSEIF v_reader_status != '正常' THEN
        SET p_result = CONCAT('失败：读者状态异常（', v_reader_status, '）');
        ROLLBACK;
    ELSE
        -- ★ 根据 reader_type 自动匹配借阅规则
        SELECT rule_id, max_borrow_count, max_borrow_days
        INTO v_rule_id, v_max_count, v_max_days
        FROM Rule WHERE reader_type = v_reader_type
        LIMIT 1;

        IF v_rule_id IS NULL THEN
            SET p_result = CONCAT('失败：未找到"', v_reader_type, '"对应的借阅规则');
            ROLLBACK;
        ELSE
            -- ★ 关键：使用 FOR UPDATE 对 Book 行加排他锁
            -- 其他事务尝试借同一本书时会阻塞在此，直到本事务提交/回滚
            SELECT available_count INTO v_available
            FROM Book WHERE book_id = p_book_id
            FOR UPDATE;

            IF v_available IS NULL THEN
                SET p_result = '失败：图书不存在';
                ROLLBACK;
            ELSEIF v_available <= 0 THEN
                SET p_result = '失败：图书无可借库存';
                ROLLBACK;
            ELSE
                -- 检查借阅数量上限
                SELECT COUNT(*) INTO v_current_count
                FROM BorrowRecord
                WHERE reader_id = p_reader_id AND borrow_status = '借阅中';

                IF v_current_count >= v_max_count THEN
                    SET p_result = CONCAT('失败：已达借阅上限（', v_max_count, '本）');
                    ROLLBACK;
                ELSE
                    -- 插入借阅记录（触发器自动扣库存，在同一事务内执行）
                    INSERT INTO BorrowRecord
                    (reader_id, book_id, rule_id, borrow_date, due_date, borrow_status)
                    VALUES
                    (p_reader_id, p_book_id, v_rule_id, CURDATE(),
                     DATE_ADD(CURDATE(), INTERVAL v_max_days DAY), '借阅中');

                    COMMIT;
                    SET p_result = '成功：借阅完成';
                END IF;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 1.2 还书存储过程（并发安全版）
-- 核心改动：
--   - 事务包裹，确保更新 BorrowRecord + 触发器恢复库存的原子性
--   - FOR UPDATE 锁定 BorrowRecord 行，防止重复还书
-- =============================================
DROP PROCEDURE IF EXISTS sp_return_book;

DELIMITER $$

CREATE PROCEDURE sp_return_book(
    IN p_borrow_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_due_date DATE;
    DECLARE v_overdue INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '失败：系统异常（可能发生死锁），请重试';
    END;

    START TRANSACTION;

    -- ★ FOR UPDATE 锁定该借阅记录，防止并发还书
    SELECT borrow_status, due_date
    INTO v_status, v_due_date
    FROM BorrowRecord WHERE borrow_id = p_borrow_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_result = '失败：借阅记录不存在';
        ROLLBACK;
    ELSEIF v_status = '已归还' THEN
        SET p_result = '失败：该记录已归还';
        ROLLBACK;
    ELSE
        -- 计算逾期天数
        SET v_overdue = GREATEST(0, DATEDIFF(CURDATE(), v_due_date));

        -- 更新归还信息（触发器自动生成罚款 + 恢复库存，同一事务）
        UPDATE BorrowRecord
        SET return_date = CURDATE(),
            overdue_days = v_overdue,
            borrow_status = '已归还'
        WHERE borrow_id = p_borrow_id;

        COMMIT;

        IF v_overdue > 0 THEN
            SET p_result = CONCAT('成功：已归还，逾期', v_overdue, '天，罚款已自动生成');
        ELSE
            SET p_result = '成功：已归还，无逾期';
        END IF;
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 1.3 续借存储过程（并发安全版）
-- =============================================
DROP PROCEDURE IF EXISTS sp_renew_book;

DELIMITER $$

CREATE PROCEDURE sp_renew_book(
    IN p_borrow_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_is_renewed BOOLEAN;
    DECLARE v_rule_id INT;
    DECLARE v_renew_days INT;
    DECLARE v_max_renew INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '失败：系统异常（可能发生死锁），请重试';
    END;

    START TRANSACTION;

    -- ★ FOR UPDATE 锁定，防止并发续借
    SELECT borrow_status, is_renewed, rule_id
    INTO v_status, v_is_renewed, v_rule_id
    FROM BorrowRecord WHERE borrow_id = p_borrow_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_result = '失败：借阅记录不存在';
        ROLLBACK;
    ELSEIF v_status != '借阅中' THEN
        SET p_result = CONCAT('失败：当前状态为"', v_status, '"，无法续借');
        ROLLBACK;
    ELSEIF v_is_renewed = TRUE THEN
        SET p_result = '失败：已续借过，不可重复续借';
        ROLLBACK;
    ELSE
        SELECT renew_days, max_renew_times
        INTO v_renew_days, v_max_renew
        FROM Rule WHERE rule_id = v_rule_id;

        UPDATE BorrowRecord
        SET due_date = DATE_ADD(due_date, INTERVAL v_renew_days DAY),
            is_renewed = TRUE
        WHERE borrow_id = p_borrow_id;

        COMMIT;
        SET p_result = CONCAT('成功：续借', v_renew_days, '天');
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 1.4 缴费存储过程（并发安全版）
-- =============================================
DROP PROCEDURE IF EXISTS sp_pay_fine;

DELIMITER $$

CREATE PROCEDURE sp_pay_fine(
    IN p_fine_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_is_paid BOOLEAN;
    DECLARE v_amount DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result = '失败：系统异常（可能发生死锁），请重试';
    END;

    START TRANSACTION;

    -- ★ FOR UPDATE 锁定罚款记录，防止重复缴费
    SELECT is_paid, fine_amount
    INTO v_is_paid, v_amount
    FROM Fine WHERE fine_id = p_fine_id
    FOR UPDATE;

    IF v_is_paid IS NULL THEN
        SET p_result = '失败：罚款记录不存在';
        ROLLBACK;
    ELSEIF v_is_paid = TRUE THEN
        SET p_result = '失败：该罚款已缴纳';
        ROLLBACK;
    ELSE
        UPDATE Fine
        SET is_paid = TRUE,
            pay_date = CURDATE()
        WHERE fine_id = p_fine_id;

        COMMIT;
        SET p_result = CONCAT('成功：已缴纳罚款 ¥', v_amount);
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 二、死锁处理机制
-- =============================================

-- =============================================
-- 2.1 死锁处理存储过程（带重试机制）
-- 说明：InnoDB 检测到死锁后会自动回滚其中一个事务，
--       MySQL 返回错误码 1213 (ER_LOCK_DEADLOCK)。
--       本过程捕获该错误并自动重试，最多 3 次。
-- =============================================
DELIMITER $$

CREATE PROCEDURE sp_borrow_book_safe(
    IN p_reader_id INT,
    IN p_book_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_retry_count INT DEFAULT 0;
    DECLARE v_max_retries INT DEFAULT 3;
    DECLARE v_done BOOLEAN DEFAULT FALSE;

    retry_loop: WHILE v_retry_count < v_max_retries AND v_done = FALSE DO
        BEGIN
            -- 专门捕获死锁错误码 1213
            DECLARE EXIT HANDLER FOR 1213
            BEGIN
                SET v_retry_count = v_retry_count + 1;
                IF v_retry_count >= v_max_retries THEN
                    SET p_result = CONCAT('失败：死锁重试', v_max_retries, '次后仍失败，请稍后再试');
                    SET v_done = TRUE;
                END IF;
                -- 不设 v_done=TRUE，循环继续重试
            END;

            -- 调用核心借书逻辑
            CALL sp_borrow_book(p_reader_id, p_book_id, p_result);
            SET v_done = TRUE;  -- 正常执行完毕，退出循环
        END;
    END WHILE;
END$$

DELIMITER ;

-- =============================================
-- 2.2 死锁场景模拟说明（用于课程演示）
-- =============================================

/*
=== 死锁演示步骤 ===

死锁发生条件：两个事务互相等待对方持有的锁

-- 场景：读者A借书1再借书2，读者B借书2再借书1（交叉加锁）

-- ▶ 会话1（模拟读者A）：
    START TRANSACTION;
    SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;  -- 锁住书1
    -- 此时暂停，等会话2执行下一步

-- ▶ 会话2（模拟读者B）：
    START TRANSACTION;
    SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;  -- 锁住书2
    SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;  -- ⚠ 等待会话1释放书1的锁

-- ▶ 回到会话1：
    SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;  -- ⚠ 等待会话2释放书2的锁
    -- 此时形成死锁环：会话1等书2，会话2等书1

-- ▶ InnoDB 死锁检测结果：
    -- MySQL 自动检测到死锁，选择回滚代价较小的事务
    -- 被回滚的事务收到错误：ERROR 1213 (40001): Deadlock found
    -- 另一个事务正常继续执行

-- ▶ 查看最近一次死锁信息：
    SHOW ENGINE INNODB STATUS;  -- 在 LATEST DETECTED DEADLOCK 段查看详情


=== 我们的防范策略 ===

1. 统一加锁顺序：所有存储过程按 "Reader → Book → BorrowRecord → Fine"
   的固定顺序加锁，避免交叉等待
2. 事务尽量短小：只在必要操作周围使用事务，减少持锁时间
3. 异常捕获重试：通过 HANDLER FOR 1213 捕获死锁，自动重试
4. InnoDB 自动检测：innodb_deadlock_detect = ON（默认开启），
   超时参数 innodb_lock_wait_timeout = 50（默认50秒）

=== 相关系统变量查看 ===
    SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';
    SHOW VARIABLES LIKE 'innodb_deadlock_detect';
*/

-- =============================================
-- 三、并发控制效果验证脚本
-- =============================================

/*
=== 验证1：库存竞争测试 ===

假设 book_id=1 的 available_count=1（只剩最后一本）

-- 会话1：
    CALL sp_borrow_book(1, 1, @r1);
    SELECT @r1;  -- 应该成功

-- 会话2（几乎同时执行）：
    CALL sp_borrow_book(2, 1, @r2);
    SELECT @r2;  -- 应该返回"失败：图书无可借库存"

原理：会话1先获得 Book(book_id=1) 的排他锁，
      会话2的 SELECT ... FOR UPDATE 被阻塞，
      等会话1 COMMIT 后，会话2才读到 available_count=0。


=== 验证2：重复还书测试 ===

-- 会话1：
    CALL sp_return_book(5, @r1);
    SELECT @r1;  -- 应该成功

-- 会话2（几乎同时）：
    CALL sp_return_book(5, @r2);
    SELECT @r2;  -- 应该返回"失败：该记录已归还"

原理：FOR UPDATE 锁住 BorrowRecord 行，
      第二个会话等待锁释放后读到已归还状态。


=== 验证3：死锁重试测试 ===

    CALL sp_borrow_book_safe(1, 1, @result);
    SELECT @result;
    -- 即使发生死锁也会自动重试最多3次
*/
