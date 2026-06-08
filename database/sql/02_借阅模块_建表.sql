create table Reader (
reader_id int primary key auto_increment,
reader_name varchar(50) not null,
gender varchar (10),
phone varchar(20),
reader_type  varchar(20) not null,
register_date date not null,
status varchar (20) default '正常'
);

create table Rule(
rule_id INT PRIMARY KEY AUTO_INCREMENT,
    reader_type VARCHAR(20) NOT NULL,
    max_borrow_days INT NOT NULL,
    max_borrow_count INT NOT NULL,
    fine_per_day DECIMAL(10,2) NOT NULL,
    max_renew_times INT NOT NULL,
    renew_days INT NOT NULL
);


create table BorrowRecord(
borrow_id int primary key auto_increment,
reader_id int not null,
book_id int not null ,
rule_id int not null,
borrow_date date not null,
due_date date not null,
return_date date,
is_renewed boolean default false,
overdue_days int default 0,
borrow_status varchar(20) default '借阅中',

 CONSTRAINT fk_borrow_reader
        FOREIGN KEY (reader_id)
        REFERENCES Reader(reader_id),

    CONSTRAINT fk_borrow_rule
        FOREIGN KEY (rule_id)
        REFERENCES Rule(rule_id)

);


create table Fine(

fine_id int primary key auto_increment,
borrow_id int not null unique,
fine_amount decimal(10,2) not null,
is_paid boolean default false,
create_date date not null,
pay_date date,

CONSTRAINT fk_fine_borrow
        FOREIGN KEY (borrow_id)
        REFERENCES BorrowRecord(borrow_id)

);
































