CREATE DATABASE IF NOT EXISTS library DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE library;

CREATE TABLE Reader (
    reader_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20),
    reader_type VARCHAR(20) NOT NULL,
    register_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT '正常'
);

CREATE TABLE Rule (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_type VARCHAR(20) NOT NULL,
    max_borrow_days INT NOT NULL,
    max_borrow_count INT NOT NULL,
    fine_per_day DECIMAL(10, 2) NOT NULL,
    max_renew_times INT NOT NULL,
    renew_days INT NOT NULL
);

CREATE TABLE BorrowRecord (
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
        REFERENCES Reader (reader_id),
    CONSTRAINT fk_borrow_rule
        FOREIGN KEY (rule_id)
        REFERENCES Rule (rule_id)
);

CREATE TABLE Fine (
    fine_id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_id INT NOT NULL UNIQUE,
    fine_amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    create_date DATE NOT NULL,
    pay_date DATE,
    CONSTRAINT fk_fine_borrow
        FOREIGN KEY (borrow_id)
        REFERENCES BorrowRecord (borrow_id)
);

-- 借阅业务默认使用 rule_id = 1
INSERT INTO Rule (
    reader_type,
    max_borrow_days,
    max_borrow_count,
    fine_per_day,
    max_renew_times,
    renew_days
) VALUES (
    '学生',
    30,
    5,
    0.50,
    1,
    15
);
