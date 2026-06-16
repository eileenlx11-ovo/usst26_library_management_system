-- =============================================
-- library_db - 展示查询脚本
-- 用于答辩演示，证明数据库设计正确、业务逻辑完整
-- =============================================

USE library_db;

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

-- =============================================
-- 七、系统用户查询【新增】
-- =============================================
SELECT '【系统用户】' AS 演示;
SELECT user_id AS 用户编号,
       username AS 用户名,
       role AS 角色,
       reader_id AS 关联读者,
       create_time AS 创建时间,
       CASE WHEN is_active = 1 THEN '启用' ELSE '禁用' END AS 状态
FROM `user`;

-- =============================================
-- 八、视图演示【新增】
-- =============================================

-- 8.1 当前借阅视图
SELECT '【视图演示：当前借阅视图 v_current_borrow】' AS 演示;
SELECT reader_name AS 读者,
       reader_type AS 类型,
       book_name AS 书名,
       borrow_date AS 借阅日期,
       due_date AS 应还日期,
       remaining_days AS 剩余天数,
       is_renewed_text AS 是否续借
FROM v_current_borrow
ORDER BY remaining_days;

-- 8.2 逾期读者视图
SELECT '【视图演示：逾期读者视图 v_overdue_readers】' AS 演示;
SELECT * FROM v_overdue_readers;

-- 8.3 图书借阅统计视图
SELECT '【视图演示：图书借阅统计 v_book_borrow_stats】' AS 演示;
SELECT book_name AS 书名,
       author_name AS 作者,
       total_count AS 馆藏总量,
       available_count AS 可借数量,
       total_borrow_times AS 累计借阅次数,
       current_borrow_count AS 当前在借,
       overdue_times AS 历史逾期次数
FROM v_book_borrow_stats
ORDER BY total_borrow_times DESC;

-- 8.4 读者借阅概况视图
SELECT '【视图演示：读者借阅概况 v_reader_summary】' AS 演示;
SELECT reader_name AS 读者,
       reader_type AS 类型,
       total_borrow_times AS 累计借阅,
       current_borrowed AS 当前在借,
       current_overdue AS 当前逾期,
       history_overdue_times AS 历史逾期次数,
       unpaid_fine AS 未缴罚款
FROM v_reader_summary
WHERE total_borrow_times > 0
ORDER BY total_borrow_times DESC;

-- 8.5 罚款明细视图
SELECT '【罚款明细视图 v_fine_detail】' AS 演示;
SELECT * FROM v_fine_detail;

-- =============================================
-- 九、存储过程演示【新增】
-- =============================================

-- 9.1 演示借书存储过程
SELECT '【存储过程演示：借书 sp_borrow_book】' AS 演示;
SELECT '操作：读者"刘子轩"(id=5) 借阅《围城》(id=10)' AS 说明;

CALL sp_borrow_book(5, 10, 1, @borrow_result);
SELECT @borrow_result AS 借书结果;

-- 查看刚才的借阅记录
SELECT borrow_id, reader_id, book_id, borrow_date, due_date, borrow_status
FROM borrowrecord
WHERE reader_id = 5 AND book_id = 10
ORDER BY borrow_id DESC LIMIT 1;

-- 9.2 演示续借存储过程
SELECT '【存储过程演示：续借 sp_renew_book】' AS 演示;
SELECT '操作：对 borrow_id=25 执行续借' AS 说明;

SELECT borrow_id, due_date, is_renewed, borrow_status
FROM borrowrecord WHERE borrow_id = 25;

CALL sp_renew_book(25, @renew_result);
SELECT @renew_result AS 续借结果;

SELECT borrow_id, due_date, is_renewed, borrow_status
FROM borrowrecord WHERE borrow_id = 25;

-- 9.3 演示还书存储过程 + 触发器自动罚款
SELECT '【存储过程演示：归还逾期图书 sp_return_book】' AS 演示;
SELECT '操作：归还 borrow_id=29（已逾期记录）' AS 说明;

SELECT borrow_id, reader_id, book_id, due_date, return_date, overdue_days, borrow_status
FROM borrowrecord WHERE borrow_id = 29;

CALL sp_return_book(29, @return_result);
SELECT @return_result AS 归还结果;

SELECT borrow_id, return_date, overdue_days, borrow_status
FROM borrowrecord WHERE borrow_id = 29;

SELECT '【触发器自动生成的罚款记录】' AS 演示;
SELECT * FROM fine WHERE borrow_id = 29;

-- 9.4 演示缴纳罚款存储过程
SELECT '【存储过程演示：缴纳罚款 sp_pay_fine】' AS 演示;
SELECT '操作：缴纳刚才生成的罚款' AS 说明;

SET @new_fine_id = (SELECT fine_id FROM fine WHERE borrow_id = 29);
CALL sp_pay_fine(@new_fine_id, @pay_result);
SELECT @pay_result AS 缴纳结果;

-- 9.5 演示存储过程的错误处理
SELECT '【存储过程错误处理演示】' AS 演示;

-- 尝试借书给挂失读者
CALL sp_borrow_book(18, 1, 1, @err_result1);
SELECT '借书给挂失读者' AS 场景, @err_result1 AS 结果;

-- 尝试重复续借
CALL sp_renew_book(7, @err_result2);
SELECT '重复续借已续借的记录' AS 场景, @err_result2 AS 结果;
