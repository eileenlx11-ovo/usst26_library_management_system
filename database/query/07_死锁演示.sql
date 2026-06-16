-- =============================================
-- 死锁演示脚本（答辩展示用）
-- 需要打开两个 MySQL 会话窗口分别执行
-- =============================================

USE library_db;

-- =============================================
-- 准备：确认测试数据
-- =============================================

-- 确认 book_id=1 和 book_id=2 都有库存
SELECT book_id, book_name, available_count
FROM Book WHERE book_id IN (1, 2);


-- =============================================
-- 演示一：死锁产生与自动检测
-- =============================================

/*
▶ 窗口1（模拟读者A）先执行：
*/

START TRANSACTION;
SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;
-- 读者A锁住了书1
-- 此时暂停，去窗口2执行下面的语句

/*
▶ 窗口2（模拟读者B）执行：
*/

START TRANSACTION;
SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;
-- 读者B锁住了书2

SELECT * FROM Book WHERE book_id = 1 FOR UPDATE;
-- ⏳ 读者B想锁书1 → 被阻塞（书1被窗口1锁着）

/*
▶ 回到窗口1执行：
*/

SELECT * FROM Book WHERE book_id = 2 FOR UPDATE;
-- 💥 死锁！读者A想锁书2，但书2被窗口2锁着
-- 窗口2想锁书1，书1被窗口1锁着 → 形成环路
-- MySQL 立刻检测到，回滚其中一个事务
-- 报错：ERROR 1213 (40001): Deadlock found when trying to get lock

/*
▶ 查看最近一次死锁详情：
*/

SHOW ENGINE INNODB STATUS;
-- 在输出中找 "LATEST DETECTED DEADLOCK" 段


-- =============================================
-- 演示二：并发借书 — FOR UPDATE 防止超借
-- =============================================

/*
假设 book_id=1 只剩 1 本库存
先手动设置：
*/

UPDATE Book SET available_count = 1 WHERE book_id = 1;
SELECT book_id, book_name, available_count FROM Book WHERE book_id = 1;

/*
▶ 窗口1（读者A借书）：
*/

CALL sp_borrow_book(1, 1, 1, @r1);
SELECT @r1;
-- 预期结果：'成功：借阅完成'

/*
▶ 窗口2（读者B几乎同时借同一本书）：
*/

CALL sp_borrow_book(2, 1, 1, @r2);
SELECT @r2;
-- 预期结果：'失败：图书无可借库存'
-- 原因：窗口1的 FOR UPDATE 锁住了 Book 行，
--       窗口2被阻塞，等窗口1 COMMIT 后才读到 available_count=0

-- 验证库存
SELECT book_id, available_count FROM Book WHERE book_id = 1;
-- 结果：available_count = 0（只被借出一次，没有超借）


-- =============================================
-- 演示三：重复还书 — FOR UPDATE 防止重复操作
-- =============================================

/*
找一条状态为"借阅中"的记录：
*/

SELECT borrow_id, reader_id, book_id, borrow_status
FROM BorrowRecord WHERE borrow_status = '借阅中' LIMIT 1;
-- 假设得到 borrow_id = X

/*
▶ 窗口1：
*/

-- CALL sp_return_book(X, @r1);
-- SELECT @r1;
-- 预期：'成功：已归还，无逾期'

/*
▶ 窗口2（几乎同时）：
*/

-- CALL sp_return_book(X, @r2);
-- SELECT @r2;
-- 预期：'失败：该记录已归还'
-- 原因：窗口1 FOR UPDATE 锁住该行，窗口2等待后读到状态已变为"已归还"


-- =============================================
-- 演示四：死锁自动重试 — sp_borrow_book_safe
-- =============================================

/*
即使发生死锁，sp_borrow_book_safe 也能自动恢复：
*/

CALL sp_borrow_book_safe(3, 2, 1, @r);
SELECT @r;
-- 如果碰到死锁会自动重试最多3次，用户无感知


-- =============================================
-- 演示五：查看相关系统变量
-- =============================================

-- 死锁检测是否开启（默认ON）
SHOW VARIABLES LIKE 'innodb_deadlock_detect';

-- 锁等待超时（默认50秒）
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';

-- 事务隔离级别（默认 REPEATABLE-READ）
SHOW VARIABLES LIKE 'transaction_isolation';


-- =============================================
-- 清理：回滚未提交的事务
-- =============================================
ROLLBACK;
