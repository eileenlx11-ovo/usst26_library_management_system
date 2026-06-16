-- =============================================
-- 视图 + 存储过程定义
-- 前置依赖：先执行 01 ~ 03 建表 + 触发器
-- =============================================

USE library_db;

-- =============================================
-- 一、视图定义（5个）
-- =============================================

-- 视图1：当前借阅视图 v_current_borrow
CREATE OR REPLACE VIEW v_current_borrow AS
SELECT r.reader_name,
       r.reader_type,
       b.book_name,
       br.borrow_date,
       br.due_date,
       DATEDIFF(br.due_date, CURDATE()) AS remaining_days,
       CASE WHEN br.is_renewed = 1 THEN '是' ELSE '否' END AS is_renewed_text
FROM BorrowRecord br
JOIN Reader r ON br.reader_id = r.reader_id
JOIN Book b ON br.book_id = b.book_id
WHERE br.borrow_status = '借阅中';

-- 视图2：逾期读者视图 v_overdue_readers
CREATE OR REPLACE VIEW v_overdue_readers AS
SELECT r.reader_id,
       r.reader_name,
       r.phone,
       r.reader_type,
       b.book_name,
       br.borrow_date,
       br.due_date,
       GREATEST(0, DATEDIFF(CURDATE(), br.due_date)) AS overdue_days,
       ru.fine_per_day,
       GREATEST(0, DATEDIFF(CURDATE(), br.due_date)) * ru.fine_per_day AS estimated_fine
FROM BorrowRecord br
JOIN Reader r ON br.reader_id = r.reader_id
JOIN Book b ON br.book_id = b.book_id
JOIN Rule ru ON br.rule_id = ru.rule_id
WHERE br.borrow_status = '逾期';

-- 视图3：图书借阅统计视图 v_book_borrow_stats
CREATE OR REPLACE VIEW v_book_borrow_stats AS
SELECT b.book_id,
       b.book_name,
       a.author_name,
       b.total_count,
       b.available_count,
       COUNT(br.borrow_id) AS total_borrow_times,
       SUM(CASE WHEN br.borrow_status = '借阅中' THEN 1 ELSE 0 END) AS current_borrow_count,
       SUM(CASE WHEN br.borrow_status = '逾期' THEN 1 ELSE 0 END) AS overdue_times
FROM Book b
LEFT JOIN Author a ON b.author_id = a.author_id
LEFT JOIN BorrowRecord br ON b.book_id = br.book_id
GROUP BY b.book_id, b.book_name, a.author_name, b.total_count, b.available_count;

-- 视图4：读者借阅概况视图 v_reader_summary
CREATE OR REPLACE VIEW v_reader_summary AS
SELECT r.reader_id,
       r.reader_name,
       r.reader_type,
       COUNT(br.borrow_id) AS total_borrow_times,
       SUM(CASE WHEN br.borrow_status = '借阅中' THEN 1 ELSE 0 END) AS current_borrowed,
       SUM(CASE WHEN br.borrow_status = '逾期' THEN 1 ELSE 0 END) AS current_overdue,
       SUM(CASE WHEN br.overdue_days > 0 THEN 1 ELSE 0 END) AS history_overdue_times,
       IFNULL((SELECT SUM(f.fine_amount) FROM Fine f
               JOIN BorrowRecord br2 ON f.borrow_id = br2.borrow_id
               WHERE br2.reader_id = r.reader_id AND f.is_paid = FALSE), 0) AS unpaid_fine
FROM Reader r
LEFT JOIN BorrowRecord br ON r.reader_id = br.reader_id
GROUP BY r.reader_id, r.reader_name, r.reader_type;

-- 视图5：罚款明细视图 v_fine_detail
CREATE OR REPLACE VIEW v_fine_detail AS
SELECT f.fine_id,
       r.reader_name,
       r.reader_type,
       b.book_name,
       br.borrow_date,
       br.due_date,
       br.return_date,
       br.overdue_days,
       f.fine_amount,
       CASE WHEN f.is_paid = 1 THEN '已缴纳' ELSE '未缴纳' END AS pay_status,
       f.create_date,
       f.pay_date
FROM Fine f
JOIN BorrowRecord br ON f.borrow_id = br.borrow_id
JOIN Reader r ON br.reader_id = r.reader_id
JOIN Book b ON br.book_id = b.book_id;

-- =============================================
-- 二、存储过程定义（4个）
-- =============================================

-- 存储过程1：借书 sp_borrow_book
DELIMITER $$

CREATE PROCEDURE sp_borrow_book(
    IN p_reader_id INT,
    IN p_book_id INT,
    IN p_rule_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_reader_status VARCHAR(20);
    DECLARE v_available INT;
    DECLARE v_current_count INT;
    DECLARE v_max_count INT;
    DECLARE v_max_days INT;

    -- 检查读者状态
    SELECT status INTO v_reader_status
    FROM Reader WHERE reader_id = p_reader_id;

    IF v_reader_status IS NULL THEN
        SET p_result = '失败：读者不存在';
    ELSEIF v_reader_status != '正常' THEN
        SET p_result = CONCAT('失败：读者状态异常（', v_reader_status, '）');
    ELSE
        -- 检查图书库存
        SELECT available_count INTO v_available
        FROM Book WHERE book_id = p_book_id;

        IF v_available IS NULL THEN
            SET p_result = '失败：图书不存在';
        ELSEIF v_available <= 0 THEN
            SET p_result = '失败：图书无可借库存';
        ELSE
            -- 检查借阅数量上限
            SELECT max_borrow_count, max_borrow_days
            INTO v_max_count, v_max_days
            FROM Rule WHERE rule_id = p_rule_id;

            SELECT COUNT(*) INTO v_current_count
            FROM BorrowRecord
            WHERE reader_id = p_reader_id AND borrow_status = '借阅中';

            IF v_current_count >= v_max_count THEN
                SET p_result = CONCAT('失败：已达借阅上限（', v_max_count, '本）');
            ELSE
                -- 插入借阅记录（触发器自动扣库存）
                INSERT INTO BorrowRecord
                (reader_id, book_id, rule_id, borrow_date, due_date, borrow_status)
                VALUES
                (p_reader_id, p_book_id, p_rule_id, CURDATE(),
                 DATE_ADD(CURDATE(), INTERVAL v_max_days DAY), '借阅中');

                SET p_result = '成功：借阅完成';
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- 存储过程2：续借 sp_renew_book
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

    SELECT borrow_status, is_renewed, rule_id
    INTO v_status, v_is_renewed, v_rule_id
    FROM BorrowRecord WHERE borrow_id = p_borrow_id;

    IF v_status IS NULL THEN
        SET p_result = '失败：借阅记录不存在';
    ELSEIF v_status != '借阅中' THEN
        SET p_result = CONCAT('失败：当前状态为"', v_status, '"，无法续借');
    ELSEIF v_is_renewed = TRUE THEN
        SET p_result = '失败：已续借过，不可重复续借';
    ELSE
        SELECT renew_days, max_renew_times
        INTO v_renew_days, v_max_renew
        FROM Rule WHERE rule_id = v_rule_id;

        UPDATE BorrowRecord
        SET due_date = DATE_ADD(due_date, INTERVAL v_renew_days DAY),
            is_renewed = TRUE
        WHERE borrow_id = p_borrow_id;

        SET p_result = CONCAT('成功：续借', v_renew_days, '天');
    END IF;
END$$

DELIMITER ;

-- 存储过程3：还书 sp_return_book
DELIMITER $$

CREATE PROCEDURE sp_return_book(
    IN p_borrow_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_status VARCHAR(20);
    DECLARE v_due_date DATE;
    DECLARE v_overdue INT;

    SELECT borrow_status, due_date
    INTO v_status, v_due_date
    FROM BorrowRecord WHERE borrow_id = p_borrow_id;

    IF v_status IS NULL THEN
        SET p_result = '失败：借阅记录不存在';
    ELSEIF v_status = '已归还' THEN
        SET p_result = '失败：该记录已归还';
    ELSE
        -- 计算逾期天数
        SET v_overdue = GREATEST(0, DATEDIFF(CURDATE(), v_due_date));

        -- 更新归还信息（触发器自动生成罚款 + 恢复库存）
        UPDATE BorrowRecord
        SET return_date = CURDATE(),
            overdue_days = v_overdue,
            borrow_status = '已归还'
        WHERE borrow_id = p_borrow_id;

        IF v_overdue > 0 THEN
            SET p_result = CONCAT('成功：已归还，逾期', v_overdue, '天，罚款已自动生成');
        ELSE
            SET p_result = '成功：已归还，无逾期';
        END IF;
    END IF;
END$$

DELIMITER ;

-- 存储过程4：缴纳罚款 sp_pay_fine
DELIMITER $$

CREATE PROCEDURE sp_pay_fine(
    IN p_fine_id INT,
    OUT p_result VARCHAR(100)
)
BEGIN
    DECLARE v_is_paid BOOLEAN;
    DECLARE v_amount DECIMAL(10,2);

    SELECT is_paid, fine_amount
    INTO v_is_paid, v_amount
    FROM Fine WHERE fine_id = p_fine_id;

    IF v_is_paid IS NULL THEN
        SET p_result = '失败：罚款记录不存在';
    ELSEIF v_is_paid = TRUE THEN
        SET p_result = '失败：该罚款已缴纳';
    ELSE
        UPDATE Fine
        SET is_paid = TRUE,
            pay_date = CURDATE()
        WHERE fine_id = p_fine_id;

        SET p_result = CONCAT('成功：已缴纳罚款 ¥', v_amount);
    END IF;
END$$

DELIMITER ;
