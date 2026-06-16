-- =============================================
-- 备份库同步触发器
-- 主库：library_db
-- 备份库：library_db_backup（需提前创建相同结构）
-- 对每张表建立 INSERT / UPDATE / DELETE 三个触发器
-- =============================================

-- =============================================
-- 1. Author 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_author_insert
AFTER INSERT ON Author
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Author VALUES (
        NEW.author_id,
        NEW.author_name,
        NEW.country,
        NEW.introduction
    );
END$$

CREATE TRIGGER trg_backup_author_update
AFTER UPDATE ON Author
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Author
    SET
        author_name = NEW.author_name,
        country = NEW.country,
        introduction = NEW.introduction
    WHERE author_id = NEW.author_id;
END$$

CREATE TRIGGER trg_backup_author_delete
AFTER DELETE ON Author
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Author
    WHERE author_id = OLD.author_id;
END$$

DELIMITER ;

-- =============================================
-- 2. Publisher 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_pub_insert
AFTER INSERT ON Publisher
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Publisher VALUES (
        NEW.publisher_id,
        NEW.publisher_name,
        NEW.address,
        NEW.phone
    );
END$$

CREATE TRIGGER trg_backup_pub_update
AFTER UPDATE ON Publisher
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Publisher
    SET
        publisher_name = NEW.publisher_name,
        address = NEW.address,
        phone = NEW.phone
    WHERE publisher_id = NEW.publisher_id;
END$$

CREATE TRIGGER trg_backup_pub_delete
AFTER DELETE ON Publisher
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Publisher
    WHERE publisher_id = OLD.publisher_id;
END$$

DELIMITER ;

-- =============================================
-- 3. Category 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_cat_insert
AFTER INSERT ON Category
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Category VALUES (
        NEW.category_id,
        NEW.category_name,
        NEW.description
    );
END$$

CREATE TRIGGER trg_backup_cat_update
AFTER UPDATE ON Category
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Category
    SET
        category_name = NEW.category_name,
        description = NEW.description
    WHERE category_id = NEW.category_id;
END$$

CREATE TRIGGER trg_backup_cat_delete
AFTER DELETE ON Category
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Category
    WHERE category_id = OLD.category_id;
END$$

DELIMITER ;

-- =============================================
-- 4. Book 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_book_insert
AFTER INSERT ON Book
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Book VALUES (
        NEW.book_id,
        NEW.isbn,
        NEW.book_name,
        NEW.author_id,
        NEW.category_id,
        NEW.publisher_id,
        NEW.publish_date,
        NEW.price,
        NEW.total_count,
        NEW.available_count,
        NEW.status
    );
END$$

CREATE TRIGGER trg_backup_book_update
AFTER UPDATE ON Book
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Book
    SET
        isbn = NEW.isbn,
        book_name = NEW.book_name,
        author_id = NEW.author_id,
        category_id = NEW.category_id,
        publisher_id = NEW.publisher_id,
        publish_date = NEW.publish_date,
        price = NEW.price,
        total_count = NEW.total_count,
        available_count = NEW.available_count,
        status = NEW.status
    WHERE book_id = NEW.book_id;
END$$

CREATE TRIGGER trg_backup_book_delete
AFTER DELETE ON Book
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Book
    WHERE book_id = OLD.book_id;
END$$

DELIMITER ;

-- =============================================
-- 5. Reader 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_reader_insert
AFTER INSERT ON Reader
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Reader VALUES (
        NEW.reader_id,
        NEW.reader_name,
        NEW.gender,
        NEW.phone,
        NEW.reader_type,
        NEW.register_date,
        NEW.status
    );
END$$

CREATE TRIGGER trg_backup_reader_update
AFTER UPDATE ON Reader
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Reader
    SET
        reader_name = NEW.reader_name,
        gender = NEW.gender,
        phone = NEW.phone,
        reader_type = NEW.reader_type,
        register_date = NEW.register_date,
        status = NEW.status
    WHERE reader_id = NEW.reader_id;
END$$

CREATE TRIGGER trg_backup_reader_delete
AFTER DELETE ON Reader
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Reader
    WHERE reader_id = OLD.reader_id;
END$$

DELIMITER ;

-- =============================================
-- 6. Rule 表（原备份脚本缺失，已补充）
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_rule_insert
AFTER INSERT ON Rule
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Rule VALUES (
        NEW.rule_id,
        NEW.reader_type,
        NEW.max_borrow_days,
        NEW.max_borrow_count,
        NEW.fine_per_day,
        NEW.max_renew_times,
        NEW.renew_days
    );
END$$

CREATE TRIGGER trg_backup_rule_update
AFTER UPDATE ON Rule
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Rule
    SET
        reader_type = NEW.reader_type,
        max_borrow_days = NEW.max_borrow_days,
        max_borrow_count = NEW.max_borrow_count,
        fine_per_day = NEW.fine_per_day,
        max_renew_times = NEW.max_renew_times,
        renew_days = NEW.renew_days
    WHERE rule_id = NEW.rule_id;
END$$

CREATE TRIGGER trg_backup_rule_delete
AFTER DELETE ON Rule
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Rule
    WHERE rule_id = OLD.rule_id;
END$$

DELIMITER ;

-- =============================================
-- 7. BorrowRecord 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_borrow_insert
AFTER INSERT ON BorrowRecord
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.BorrowRecord VALUES (
        NEW.borrow_id,
        NEW.reader_id,
        NEW.book_id,
        NEW.rule_id,
        NEW.borrow_date,
        NEW.due_date,
        NEW.return_date,
        NEW.is_renewed,
        NEW.overdue_days,
        NEW.borrow_status
    );
END$$

CREATE TRIGGER trg_backup_borrow_update
AFTER UPDATE ON BorrowRecord
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.BorrowRecord
    SET
        reader_id = NEW.reader_id,
        book_id = NEW.book_id,
        rule_id = NEW.rule_id,
        borrow_date = NEW.borrow_date,
        due_date = NEW.due_date,
        return_date = NEW.return_date,
        is_renewed = NEW.is_renewed,
        overdue_days = NEW.overdue_days,
        borrow_status = NEW.borrow_status
    WHERE borrow_id = NEW.borrow_id;
END$$

CREATE TRIGGER trg_backup_borrow_delete
AFTER DELETE ON BorrowRecord
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.BorrowRecord
    WHERE borrow_id = OLD.borrow_id;
END$$

DELIMITER ;

-- =============================================
-- 8. Fine 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_fine_insert
AFTER INSERT ON Fine
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.Fine VALUES (
        NEW.fine_id,
        NEW.borrow_id,
        NEW.fine_amount,
        NEW.is_paid,
        NEW.create_date,
        NEW.pay_date
    );
END$$

CREATE TRIGGER trg_backup_fine_update
AFTER UPDATE ON Fine
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.Fine
    SET
        borrow_id = NEW.borrow_id,
        fine_amount = NEW.fine_amount,
        is_paid = NEW.is_paid,
        create_date = NEW.create_date,
        pay_date = NEW.pay_date
    WHERE fine_id = NEW.fine_id;
END$$

CREATE TRIGGER trg_backup_fine_delete
AFTER DELETE ON Fine
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.Fine
    WHERE fine_id = OLD.fine_id;
END$$

DELIMITER ;

-- =============================================
-- 9. User 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_user_insert
AFTER INSERT ON `User`
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.`User` VALUES (
        NEW.user_id,
        NEW.username,
        NEW.password,
        NEW.role,
        NEW.reader_id,
        NEW.create_time,
        NEW.last_login,
        NEW.is_active
    );
END$$

CREATE TRIGGER trg_backup_user_update
AFTER UPDATE ON `User`
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.`User`
    SET
        username = NEW.username,
        password = NEW.password,
        role = NEW.role,
        reader_id = NEW.reader_id,
        create_time = NEW.create_time,
        last_login = NEW.last_login,
        is_active = NEW.is_active
    WHERE user_id = NEW.user_id;
END$$

CREATE TRIGGER trg_backup_user_delete
AFTER DELETE ON `User`
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.`User`
    WHERE user_id = OLD.user_id;
END$$

DELIMITER ;

-- =============================================
-- 10. InviteCode 表
-- =============================================
DELIMITER $$

CREATE TRIGGER trg_backup_invite_insert
AFTER INSERT ON InviteCode
FOR EACH ROW
BEGIN
    INSERT INTO `library_db_backup`.InviteCode VALUES (
        NEW.code_id,
        NEW.code,
        NEW.role,
        NEW.created_by,
        NEW.used_by,
        NEW.is_used,
        NEW.create_time,
        NEW.expire_time
    );
END$$

CREATE TRIGGER trg_backup_invite_update
AFTER UPDATE ON InviteCode
FOR EACH ROW
BEGIN
    UPDATE `library_db_backup`.InviteCode
    SET
        code = NEW.code,
        role = NEW.role,
        created_by = NEW.created_by,
        used_by = NEW.used_by,
        is_used = NEW.is_used,
        create_time = NEW.create_time,
        expire_time = NEW.expire_time
    WHERE code_id = NEW.code_id;
END$$

CREATE TRIGGER trg_backup_invite_delete
AFTER DELETE ON InviteCode
FOR EACH ROW
BEGIN
    DELETE FROM `library_db_backup`.InviteCode
    WHERE code_id = OLD.code_id;
END$$

DELIMITER ;
