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