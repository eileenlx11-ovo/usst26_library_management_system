-- =============================================
-- 借阅系统数据库 - 展示查询脚本
-- 用于答辩演示，证明数据库设计正确、业务逻辑完整
-- =============================================

USE 借阅系统数据库;

-- =============================================
-- 一、基础查询：查看各表数据
-- =============================================

-- 1.1 查看借阅规则
SELECT '【借阅规则一览】' AS 演示;
SELECT rule_id AS 规则编号,
       reader_type AS 读者类型,
       max_borrow_days AS 最大借阅天数,
       max_borrow_count AS 最大借阅数量,
       fine_per_day AS 每日逾期费用,
       max_renew_times AS 最大续借次数,
       renew_days AS 续借天数
FROM `rule`;

-- 1.2 查看读者信息
SELECT '【读者信息】' AS 演示;
SELECT reader_id AS 读者编号,
       reader_name AS 姓名,
       gender AS 性别,
       reader_type AS 类型,
       register_date AS 注册日期,
       status AS 状态
FROM reader;

-- =============================================
-- 二、核心业务查询
-- =============================================

-- 2.1 查询某位读者的借阅记录及应还日期
SELECT '【读者"陈思远"的借阅记录】' AS 演示;
SELECT br.borrow_id AS 借阅编号,
       b.book_name AS 书名,
       br.borrow_date AS 借阅日期,
       br.due_date AS 应还日期,
       br.return_date AS 归还日期,
       CASE WHEN br.is_renewed = 1 THEN '是' ELSE '否' END AS 是否续借,
       br.borrow_status AS 状态
FROM borrowrecord br
JOIN book b ON br.book_id = b.book_id
WHERE br.reader_id = 1
ORDER BY br.borrow_date DESC;

-- 2.2 查询当前所有"借阅中"的记录
SELECT '【当前借阅中的图书】' AS 演示;
SELECT r.reader_name AS 读者,
       r.reader_type AS 读者类型,
       b.book_name AS 书名,
       br.borrow_date AS 借阅日期,
       br.due_date AS 应还日期,
       DATEDIFF(br.due_date, CURDATE()) AS 剩余天数
FROM borrowrecord br
JOIN reader r ON br.reader_id = r.reader_id
JOIN book b ON br.book_id = b.book_id
WHERE br.borrow_status = '借阅中'
ORDER BY br.due_date;

-- 2.3 查询逾期未还的记录（重点展示）
SELECT '【逾期未还记录】' AS 演示;
SELECT r.reader_name AS 读者,
       r.phone AS 联系电话,
       b.book_name AS 书名,
       br.borrow_date AS 借阅日期,
       br.due_date AS 应还日期,
       DATEDIFF(CURDATE(), br.due_date) AS 已逾期天数,
       ru.fine_per_day AS 每日罚款,
       DATEDIFF(CURDATE(), br.due_date) * ru.fine_per_day AS 预计罚款金额
FROM borrowrecord br
JOIN reader r ON br.reader_id = r.reader_id
JOIN book b ON br.book_id = b.book_id
JOIN `rule` ru ON br.rule_id = ru.rule_id
WHERE br.borrow_status = '逾期'
ORDER BY 已逾期天数 DESC;

-- 2.4 查询续借记录
SELECT '【续借记录】' AS 演示;
SELECT r.reader_name AS 读者,
       b.book_name AS 书名,
       br.borrow_date AS 借阅日期,
       br.due_date AS 应还日期,
       br.borrow_status AS 状态
FROM borrowrecord br
JOIN reader r ON br.reader_id = r.reader_id
JOIN book b ON br.book_id = b.book_id
WHERE br.is_renewed = 1;

-- =============================================
-- 三、罚款相关查询
-- =============================================

-- 3.1 罚款记录明细
SELECT '【罚款记录明细】' AS 演示;
SELECT f.fine_id AS 罚款编号,
       r.reader_name AS 读者,
       b.book_name AS 书名,
       br.overdue_days AS 逾期天数,
       f.fine_amount AS 罚款金额,
       CASE WHEN f.is_paid = 1 THEN '已缴纳' ELSE '未缴纳' END AS 缴纳状态,
       f.create_date AS 生成日期,
       f.pay_date AS 缴纳日期
FROM fine f
JOIN borrowrecord br ON f.borrow_id = br.borrow_id
JOIN reader r ON br.reader_id = r.reader_id
JOIN book b ON br.book_id = b.book_id;

-- 3.2 未缴纳罚款汇总
SELECT '【未缴纳罚款】' AS 演示;
SELECT r.reader_name AS 读者,
       r.phone AS 联系电话,
       SUM(f.fine_amount) AS 欠款总额
FROM fine f
JOIN borrowrecord br ON f.borrow_id = br.borrow_id
JOIN reader r ON br.reader_id = r.reader_id
WHERE f.is_paid = 0
GROUP BY r.reader_id, r.reader_name, r.phone;

-- =============================================
-- 四、统计报表（加分项）
-- =============================================

-- 4.1 热门图书排行榜（借阅次数最多）
SELECT '【热门图书 TOP5】' AS 演示;
SELECT b.book_name AS 书名,
       a.author_name AS 作者,
       c.category_name AS 分类,
       COUNT(*) AS 借阅次数
FROM borrowrecord br
JOIN book b ON br.book_id = b.book_id
JOIN author a ON b.author_id = a.author_id
JOIN category c ON b.category_id = c.category_id
GROUP BY b.book_id, b.book_name, a.author_name, c.category_name
ORDER BY 借阅次数 DESC
LIMIT 5;

-- 4.2 活跃读者排行榜（借阅次数最多）
SELECT '【活跃读者 TOP5】' AS 演示;
SELECT r.reader_name AS 读者,
       r.reader_type AS 类型,
       COUNT(*) AS 借阅次数,
       SUM(CASE WHEN br.borrow_status = '借阅中' THEN 1 ELSE 0 END) AS 当前在借
FROM borrowrecord br
JOIN reader r ON br.reader_id = r.reader_id
GROUP BY r.reader_id, r.reader_name, r.reader_type
ORDER BY 借阅次数 DESC
LIMIT 5;

-- 4.3 各月借阅量统计
SELECT '【月度借阅量统计】' AS 演示;
SELECT DATE_FORMAT(borrow_date, '%Y-%m') AS 月份,
       COUNT(*) AS 借阅量
FROM borrowrecord
GROUP BY DATE_FORMAT(borrow_date, '%Y-%m')
ORDER BY 月份;

-- 4.4 各类型读者借阅统计
SELECT '【各类型读者借阅对比】' AS 演示;
SELECT r.reader_type AS 读者类型,
       COUNT(*) AS 借阅总次数,
       SUM(CASE WHEN br.overdue_days > 0 THEN 1 ELSE 0 END) AS 逾期次数,
       ROUND(SUM(CASE WHEN br.overdue_days > 0 THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS 逾期率百分比
FROM borrowrecord br
JOIN reader r ON br.reader_id = r.reader_id
GROUP BY r.reader_type
ORDER BY 借阅总次数 DESC;

-- 4.5 各分类图书借阅量
SELECT '【各分类借阅量】' AS 演示;
SELECT c.category_name AS 图书分类,
       COUNT(*) AS 借阅次数
FROM borrowrecord br
JOIN book b ON br.book_id = b.book_id
JOIN category c ON b.category_id = c.category_id
GROUP BY c.category_id, c.category_name
ORDER BY 借阅次数 DESC;

-- =============================================
-- 五、业务操作演示
-- =============================================

-- 5.1 演示续借操作（对 borrow_id=24 执行续借）
SELECT '【续借操作演示 - 操作前】' AS 演示;
SELECT borrow_id, due_date, is_renewed, borrow_status
FROM borrowrecord WHERE borrow_id = 24;

UPDATE borrowrecord
SET due_date = DATE_ADD(due_date, INTERVAL 15 DAY),
    is_renewed = TRUE
WHERE borrow_id = 24
  AND is_renewed = FALSE
  AND borrow_status = '借阅中';

SELECT '【续借操作演示 - 操作后】' AS 演示;
SELECT borrow_id, due_date, is_renewed, borrow_status
FROM borrowrecord WHERE borrow_id = 24;

-- 5.2 演示归还图书 + 触发器自动生成罚款
-- （对逾期记录 borrow_id=29 执行归还）
SELECT '【归还操作演示 - 操作前】' AS 演示;
SELECT borrow_id, reader_id, book_id, due_date, return_date, overdue_days, borrow_status
FROM borrowrecord WHERE borrow_id = 29;

UPDATE borrowrecord
SET return_date = CURDATE(),
    overdue_days = GREATEST(DATEDIFF(CURDATE(), due_date), 0),
    borrow_status = '已归还'
WHERE borrow_id = 29;

SELECT '【归还操作演示 - 操作后】' AS 演示;
SELECT borrow_id, return_date, overdue_days, borrow_status
FROM borrowrecord WHERE borrow_id = 29;

SELECT '【触发器自动生成的罚款记录】' AS 演示;
SELECT * FROM fine WHERE borrow_id = 29;

-- =============================================
-- 六、系统概览（总结性查询）
-- =============================================
SELECT '【系统运行概览】' AS 演示;
SELECT
    (SELECT COUNT(*) FROM reader WHERE status = '正常') AS 正常读者数,
    (SELECT COUNT(*) FROM book) AS 图书总数,
    (SELECT COUNT(*) FROM borrowrecord) AS 借阅记录总数,
    (SELECT COUNT(*) FROM borrowrecord WHERE borrow_status = '借阅中') AS 当前借阅中,
    (SELECT COUNT(*) FROM borrowrecord WHERE borrow_status = '逾期') AS 当前逾期,
    (SELECT COUNT(*) FROM fine WHERE is_paid = 0) AS 未缴罚款笔数,
    (SELECT IFNULL(SUM(fine_amount), 0) FROM fine WHERE is_paid = 0) AS 未缴罚款总额;
