-- =============================================
-- 触发器脚本
-- =============================================

USE 借阅系统数据库;

-- =============================================
-- 触发器1：归还图书时自动计算罚款（原有）
-- 条件：return_date 从NULL变为非NULL，且 overdue_days > 0
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_auto_create_fine
AFTER UPDATE ON BorrowRecord
FOR EACH ROW
BEGIN
    DECLARE v_fine_per_day DECIMAL(10,2);
    DECLARE v_fine_amount DECIMAL(10,2);

    IF NEW.return_date IS NOT NULL
       AND NEW.overdue_days > 0
       AND OLD.return_date IS NULL THEN

        SELECT fine_per_day
        INTO v_fine_per_day
        FROM Rule
        WHERE rule_id = NEW.rule_id;

        SET v_fine_amount = NEW.overdue_days * v_fine_per_day;

        INSERT INTO Fine
        (borrow_id, fine_amount, is_paid, create_date)
        VALUES
        (NEW.borrow_id, v_fine_amount, FALSE, CURDATE());

    END IF;
END$$

DELIMITER ;

-- =============================================
-- 触发器2：借出图书时自动扣减库存【新增】
-- 使用 BEFORE INSERT：在记录写入前检查库存，
-- 若库存不足直接 SIGNAL 拒绝整个 INSERT，
-- 保证不会出现"记录插入成功但库存未扣"的不一致
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_borrow_decrease_stock
BEFORE INSERT ON BorrowRecord
FOR EACH ROW
BEGIN
    DECLARE v_available INT;

    SELECT available_count INTO v_available
    FROM Book WHERE book_id = NEW.book_id;

    IF v_available IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '借阅失败：图书不存在';
    ELSEIF v_available <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '借阅失败：该图书已无可借库存';
    ELSE
        UPDATE Book
        SET available_count = available_count - 1
        WHERE book_id = NEW.book_id;
    END IF;
END$$

DELIMITER ;

-- =============================================
-- 触发器3：归还图书时自动恢复库存【新增】
-- 使用 BEFORE UPDATE：在 BorrowRecord 更新前恢复库存，
-- 与触发器2保持一致的 BEFORE 风格
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_return_increase_stock
BEFORE UPDATE ON BorrowRecord
FOR EACH ROW
BEGIN
    IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
        UPDATE Book
        SET available_count = available_count + 1
        WHERE book_id = NEW.book_id;
    END IF;
END$$

DELIMITER ;
