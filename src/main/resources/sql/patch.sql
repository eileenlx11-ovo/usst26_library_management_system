USE library;

CREATE TABLE IF NOT EXISTS BorrowRecord (
    borrow_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_id INT NOT NULL,
    book_id INT NOT NULL,
    rule_id INT NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    is_renewed BOOLEAN DEFAULT FALSE,
    overdue_days INT DEFAULT 0,
    borrow_status VARCHAR(20) DEFAULT '借阅中',
    CONSTRAINT fk_borrow_reader
        FOREIGN KEY (reader_id)
        REFERENCES reader (reader_id),
    CONSTRAINT fk_borrow_rule
        FOREIGN KEY (rule_id)
        REFERENCES rule (rule_id)
);

CREATE TABLE IF NOT EXISTS Fine (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_id INT NOT NULL UNIQUE,
    fine_amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    create_date DATE NOT NULL,
    pay_date DATE,
    CONSTRAINT fk_fine_borrow
        FOREIGN KEY (borrow_id)
        REFERENCES borrowrecord (borrow_id)
);

INSERT INTO rule (
    reader_type,
    max_borrow_days,
    max_borrow_count,
    fine_per_day,
    max_renew_times,
    renew_days
)
SELECT 'student', 30, 5, 0.50, 1, 15
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM rule LIMIT 1);
