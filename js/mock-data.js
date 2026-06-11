/**
 * Mock数据层 - 与数据库 schema 完全对齐
 *
 * 对应数据库表：
 *   Author → authors         作者（15条）
 *   Publisher → publishers   出版社（8条）
 *   Category → categories    分类（8条，含description）
 *   Book → books             图书（10条，外键关联author/publisher/category）
 *   Reader → readers         读者（20条，类型：本科生/研究生/教师/校外人员）
 *   Rule → rules             借阅规则（4条，按读者类型）
 *   BorrowRecord → borrowRecords  借阅记录（30条）
 *   Fine → fines             罚款（6条）
 *   User → users             系统用户（20条，角色+reader_id关联）
 *   InviteCode → inviteCodes 邀请码（9条种子）
 */

const MockData = (function () {
    // ===================== 作者（15位） =====================
    let _authors = [
        { author_id: 1, author_name: "鲁迅", country: "中国" },
        { author_id: 2, author_name: "莫言", country: "中国" },
        { author_id: 3, author_name: "余华", country: "中国" },
        { author_id: 4, author_name: "刘慈欣", country: "中国" },
        { author_id: 5, author_name: "王小波", country: "中国" },
        { author_id: 6, author_name: "村上春树", country: "日本" },
        { author_id: 7, author_name: "东野圭吾", country: "日本" },
        { author_id: 8, author_name: "J.K.罗琳", country: "英国" },
        { author_id: 9, author_name: "乔治·奥威尔", country: "英国" },
        { author_id: 10, author_name: "马尔克斯", country: "哥伦比亚" },
        { author_id: 11, author_name: "陈忠实", country: "中国" },
        { author_id: 12, author_name: "钱钟书", country: "中国" },
        { author_id: 13, author_name: "阿加莎·克里斯蒂", country: "英国" },
        { author_id: 14, author_name: "卡夫卡", country: "奥地利" },
        { author_id: 15, author_name: "曹雪芹", country: "中国" }
    ];
    let _nextAuthorId = 16;

    // ===================== 出版社（8家） =====================
    let _publishers = [
        { publisher_id: 1, publisher_name: "人民文学出版社" },
        { publisher_id: 2, publisher_name: "上海译文出版社" },
        { publisher_id: 3, publisher_name: "中信出版社" },
        { publisher_id: 4, publisher_name: "重庆出版社" },
        { publisher_id: 5, publisher_name: "南海出版公司" },
        { publisher_id: 6, publisher_name: "译林出版社" },
        { publisher_id: 7, publisher_name: "作家出版社" },
        { publisher_id: 8, publisher_name: "人民邮电出版社" }
    ];
    let _nextPublisherId = 9;

    // ===================== 分类（8类，含description） =====================
    let _categories = [
        { category_id: 1, category_name: "中国文学", description: "中国古代及现当代文学作品" },
        { category_id: 2, category_name: "外国文学", description: "翻译引进的国外文学作品" },
        { category_id: 3, category_name: "科幻小说", description: "以科学幻想为题材的小说作品" },
        { category_id: 4, category_name: "推理悬疑", description: "侦探推理及悬疑类小说" },
        { category_id: 5, category_name: "历史传记", description: "历史事件及人物传记类书籍" },
        { category_id: 6, category_name: "哲学思想", description: "哲学、思想及社会科学类书籍" },
        { category_id: 7, category_name: "计算机科学", description: "计算机技术与编程相关书籍" },
        { category_id: 8, category_name: "自然科学", description: "物理、化学、生物等自然科学类书籍" }
    ];
    let _nextCategoryId = 9;

    // ===================== 图书（10本真实图书） =====================
    let _books = [
        { id: 1, isbn: "978-7-02-000220-6", title: "呐喊", author_id: 1, author: "鲁迅", category_id: 1, category: "中国文学", publisher_id: 1, publisher: "人民文学出版社", publish_date: "2012-03-01", price: 19.00, total: 5, available: 2, status: "在馆", borrowCount: 2 },
        { id: 2, isbn: "978-7-02-011207-3", title: "红高粱家族", author_id: 2, author: "莫言", category_id: 1, category: "中国文学", publisher_id: 1, publisher: "人民文学出版社", publish_date: "2012-10-01", price: 35.00, total: 3, available: 1, status: "在馆", borrowCount: 2 },
        { id: 3, isbn: "978-7-5063-7295-3", title: "活着", author_id: 3, author: "余华", category_id: 1, category: "中国文学", publisher_id: 7, publisher: "作家出版社", publish_date: "2012-08-01", price: 28.00, total: 6, available: 3, status: "在馆", borrowCount: 3 },
        { id: 4, isbn: "978-7-229-03093-3", title: "三体", author_id: 4, author: "刘慈欣", category_id: 3, category: "科幻小说", publisher_id: 4, publisher: "重庆出版社", publish_date: "2008-01-01", price: 23.00, total: 8, available: 4, status: "在馆", borrowCount: 4 },
        { id: 5, isbn: "978-7-5327-5918-4", title: "挪威的森林", author_id: 6, author: "村上春树", category_id: 2, category: "外国文学", publisher_id: 2, publisher: "上海译文出版社", publish_date: "2018-07-01", price: 36.00, total: 4, available: 2, status: "在馆", borrowCount: 3 },
        { id: 6, isbn: "978-7-5442-7950-8", title: "嫌疑人X的献身", author_id: 7, author: "东野圭吾", category_id: 4, category: "推理悬疑", publisher_id: 5, publisher: "南海出版公司", publish_date: "2014-05-01", price: 32.00, total: 5, available: 1, status: "在馆", borrowCount: 3 },
        { id: 7, isbn: "978-7-02-008476-9", title: "哈利·波特与魔法石", author_id: 8, author: "J.K.罗琳", category_id: 2, category: "外国文学", publisher_id: 1, publisher: "人民文学出版社", publish_date: "2020-10-01", price: 39.00, total: 6, available: 3, status: "在馆", borrowCount: 3 },
        { id: 8, isbn: "978-7-5327-3408-2", title: "1984", author_id: 9, author: "乔治·奥威尔", category_id: 2, category: "外国文学", publisher_id: 2, publisher: "上海译文出版社", publish_date: "2017-01-01", price: 32.00, total: 4, available: 1, status: "在馆", borrowCount: 3 },
        { id: 9, isbn: "978-7-5442-3425-5", title: "百年孤独", author_id: 10, author: "马尔克斯", category_id: 2, category: "外国文学", publisher_id: 5, publisher: "南海出版公司", publish_date: "2017-08-01", price: 55.00, total: 5, available: 2, status: "在馆", borrowCount: 3 },
        { id: 10, isbn: "978-7-02-000215-2", title: "围城", author_id: 12, author: "钱钟书", category_id: 1, category: "中国文学", publisher_id: 1, publisher: "人民文学出版社", publish_date: "1991-02-01", price: 25.00, total: 4, available: 2, status: "在馆", borrowCount: 3 }
    ];
    let _nextBookId = 11;

    // ===================== 读者（20条，与数据库对齐） =====================
    let _readers = [
        { id: 1, cardId: "R2024001", name: "陈思远", gender: "男", phone: "13912345678", email: "chensiyuan@example.com", type: "本科生", registerDate: "2024-09-01", status: "正常" },
        { id: 2, cardId: "R2024002", name: "林晓彤", gender: "女", phone: "13898765432", email: "linxiaotong@example.com", type: "本科生", registerDate: "2024-09-01", status: "正常" },
        { id: 3, cardId: "R2024003", name: "王浩然", gender: "男", phone: "15012340001", email: "wanghaoran@example.com", type: "本科生", registerDate: "2024-09-03", status: "正常" },
        { id: 4, cardId: "R2024004", name: "赵雨萱", gender: "女", phone: "15198760002", email: "zhaoyuxuan@example.com", type: "本科生", registerDate: "2024-09-05", status: "正常" },
        { id: 5, cardId: "R2025001", name: "刘子轩", gender: "男", phone: "13712340003", email: "liuzixuan@example.com", type: "本科生", registerDate: "2025-02-20", status: "正常" },
        { id: 6, cardId: "R2023001", name: "张明慧", gender: "女", phone: "18612340004", email: "zhangminghui@example.com", type: "研究生", registerDate: "2023-09-01", status: "正常" },
        { id: 7, cardId: "R2023002", name: "李博文", gender: "男", phone: "18798760005", email: "libowen@example.com", type: "研究生", registerDate: "2023-09-01", status: "正常" },
        { id: 8, cardId: "R2024005", name: "吴思琪", gender: "女", phone: "13612340006", email: "wusiqi@example.com", type: "研究生", registerDate: "2024-03-01", status: "正常" },
        { id: 9, cardId: "R2024006", name: "周天宇", gender: "男", phone: "15912340007", email: "zhoutianyu@example.com", type: "研究生", registerDate: "2024-09-01", status: "正常" },
        { id: 10, cardId: "R2022001", name: "孙艺涵", gender: "女", phone: "17612340008", email: "sunyihan@example.com", type: "研究生", registerDate: "2022-09-01", status: "正常" },
        { id: 11, cardId: "T2020001", name: "马建国", gender: "男", phone: "13312340009", email: "majianguo@example.com", type: "教师", registerDate: "2020-03-15", status: "正常" },
        { id: 12, cardId: "T2019001", name: "黄丽华", gender: "女", phone: "13598760010", email: "huanglihua@example.com", type: "教师", registerDate: "2019-09-01", status: "正常" },
        { id: 13, cardId: "T2021001", name: "杨志强", gender: "男", phone: "18912340011", email: "yangzhiqiang@example.com", type: "教师", registerDate: "2021-06-01", status: "正常" },
        { id: 14, cardId: "T2022001", name: "徐静怡", gender: "女", phone: "15512340012", email: "xujingyi@example.com", type: "教师", registerDate: "2022-09-01", status: "正常" },
        { id: 15, cardId: "T2018001", name: "郑伟明", gender: "男", phone: "13812340013", email: "zhengweiming@example.com", type: "教师", registerDate: "2018-03-01", status: "正常" },
        { id: 16, cardId: "E2025001", name: "何小芳", gender: "女", phone: "13612340014", email: "hexiaofang@example.com", type: "校外人员", registerDate: "2025-10-10", status: "正常" },
        { id: 17, cardId: "E2025002", name: "钱学林", gender: "男", phone: "18812340015", email: "qianxuelin@example.com", type: "校外人员", registerDate: "2025-11-01", status: "正常" },
        { id: 18, cardId: "R2025002", name: "方志远", gender: "男", phone: "13712340016", email: "fangzhiyuan@example.com", type: "本科生", registerDate: "2025-03-01", status: "挂失" },
        { id: 19, cardId: "R2024007", name: "高雅文", gender: "女", phone: "15612340017", email: "gaoyawen@example.com", type: "本科生", registerDate: "2024-09-01", status: "注销" },
        { id: 20, cardId: "R2024008", name: "唐俊杰", gender: "男", phone: "13912340018", email: "tangjunjie@example.com", type: "研究生", registerDate: "2024-09-01", status: "正常" }
    ];
    let _nextReaderId = 21;

    // ===================== 借阅规则（4条，对应数据库） =====================
    let _rules = [
        { ruleId: 1, readerType: "本科生", maxBorrowDays: 30, maxBorrowCount: 5, finePerDay: 0.50, maxRenewTimes: 1, renewDays: 15 },
        { ruleId: 2, readerType: "研究生", maxBorrowDays: 60, maxBorrowCount: 10, finePerDay: 0.30, maxRenewTimes: 2, renewDays: 30 },
        { ruleId: 3, readerType: "教师", maxBorrowDays: 90, maxBorrowCount: 20, finePerDay: 0.20, maxRenewTimes: 3, renewDays: 30 },
        { ruleId: 4, readerType: "校外人员", maxBorrowDays: 14, maxBorrowCount: 2, finePerDay: 1.00, maxRenewTimes: 0, renewDays: 0 }
    ];
    let _nextRuleId = 5;

    // ===================== 借阅记录（30条，覆盖各种场景） =====================
    let _borrowRecords = [
        // 正常借还（本科生）
        { borrowId: 1, readerId: 1, bookId: 1, ruleId: 1, borrowDate: "2025-10-05", dueDate: "2025-11-04", returnDate: "2025-10-28", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 2, readerId: 1, bookId: 2, ruleId: 1, borrowDate: "2025-11-10", dueDate: "2025-12-10", returnDate: "2025-12-08", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 3, readerId: 2, bookId: 3, ruleId: 1, borrowDate: "2025-10-12", dueDate: "2025-11-11", returnDate: "2025-11-10", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 4, readerId: 3, bookId: 4, ruleId: 1, borrowDate: "2025-11-01", dueDate: "2025-12-01", returnDate: "2025-11-20", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 5, readerId: 4, bookId: 5, ruleId: 1, borrowDate: "2025-12-01", dueDate: "2025-12-31", returnDate: "2025-12-25", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        // 续借场景
        { borrowId: 6, readerId: 5, bookId: 6, ruleId: 1, borrowDate: "2026-01-05", dueDate: "2026-02-19", returnDate: "2026-02-15", renewedTimes: 1, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 7, readerId: 1, bookId: 7, ruleId: 1, borrowDate: "2026-03-01", dueDate: "2026-04-15", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        // 逾期归还（本科生）
        { borrowId: 8, readerId: 2, bookId: 8, ruleId: 1, borrowDate: "2025-09-15", dueDate: "2025-10-15", returnDate: "2025-10-22", renewedTimes: 0, overdueDays: 7, borrowStatus: "已归还" },
        { borrowId: 9, readerId: 3, bookId: 9, ruleId: 1, borrowDate: "2025-11-20", dueDate: "2025-12-20", returnDate: "2025-12-25", renewedTimes: 0, overdueDays: 5, borrowStatus: "已归还" },
        { borrowId: 10, readerId: 4, bookId: 10, ruleId: 1, borrowDate: "2026-02-10", dueDate: "2026-03-12", returnDate: "2026-03-20", renewedTimes: 0, overdueDays: 8, borrowStatus: "已归还" },
        // 研究生借阅
        { borrowId: 11, readerId: 6, bookId: 1, ruleId: 2, borrowDate: "2025-10-01", dueDate: "2025-11-30", returnDate: "2025-11-15", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 12, readerId: 7, bookId: 2, ruleId: 2, borrowDate: "2025-11-01", dueDate: "2025-12-31", returnDate: "2025-12-20", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 13, readerId: 8, bookId: 3, ruleId: 2, borrowDate: "2026-01-10", dueDate: "2026-03-11", returnDate: "2026-03-05", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 14, readerId: 9, bookId: 4, ruleId: 2, borrowDate: "2026-02-15", dueDate: "2026-04-16", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        // 研究生逾期
        { borrowId: 15, readerId: 10, bookId: 5, ruleId: 2, borrowDate: "2025-09-01", dueDate: "2025-10-31", returnDate: "2025-11-10", renewedTimes: 0, overdueDays: 10, borrowStatus: "已归还" },
        // 研究生续借
        { borrowId: 16, readerId: 6, bookId: 6, ruleId: 2, borrowDate: "2026-03-01", dueDate: "2026-05-30", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        // 教师借阅
        { borrowId: 17, readerId: 11, bookId: 7, ruleId: 3, borrowDate: "2025-09-01", dueDate: "2025-11-30", returnDate: "2025-11-20", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 18, readerId: 12, bookId: 8, ruleId: 3, borrowDate: "2025-10-15", dueDate: "2026-01-13", returnDate: "2026-01-10", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 19, readerId: 13, bookId: 9, ruleId: 3, borrowDate: "2026-01-05", dueDate: "2026-04-05", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        { borrowId: 20, readerId: 14, bookId: 10, ruleId: 3, borrowDate: "2026-02-20", dueDate: "2026-05-21", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        // 教师逾期
        { borrowId: 21, readerId: 15, bookId: 1, ruleId: 3, borrowDate: "2025-06-01", dueDate: "2025-08-30", returnDate: "2025-09-05", renewedTimes: 0, overdueDays: 6, borrowStatus: "已归还" },
        // 校外人员借阅
        { borrowId: 22, readerId: 16, bookId: 2, ruleId: 4, borrowDate: "2026-04-01", dueDate: "2026-04-15", returnDate: "2026-04-14", renewedTimes: 0, overdueDays: 0, borrowStatus: "已归还" },
        { borrowId: 23, readerId: 17, bookId: 3, ruleId: 4, borrowDate: "2026-04-10", dueDate: "2026-04-24", returnDate: "2026-04-28", renewedTimes: 0, overdueDays: 4, borrowStatus: "已归还" },
        // 当前借阅中
        { borrowId: 24, readerId: 1, bookId: 4, ruleId: 1, borrowDate: "2026-05-20", dueDate: "2026-06-19", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        { borrowId: 25, readerId: 2, bookId: 5, ruleId: 1, borrowDate: "2026-05-25", dueDate: "2026-06-24", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        { borrowId: 26, readerId: 5, bookId: 6, ruleId: 1, borrowDate: "2026-05-28", dueDate: "2026-06-27", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        { borrowId: 27, readerId: 7, bookId: 7, ruleId: 2, borrowDate: "2026-05-10", dueDate: "2026-07-09", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        { borrowId: 28, readerId: 11, bookId: 8, ruleId: 3, borrowDate: "2026-04-01", dueDate: "2026-06-30", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "借阅中" },
        // 逾期未还
        { borrowId: 29, readerId: 3, bookId: 9, ruleId: 1, borrowDate: "2026-04-15", dueDate: "2026-05-15", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "逾期" },
        { borrowId: 30, readerId: 8, bookId: 10, ruleId: 2, borrowDate: "2026-03-01", dueDate: "2026-04-30", returnDate: "", renewedTimes: 0, overdueDays: 0, borrowStatus: "逾期" }
    ];
    let _nextBorrowId = 31;

    // ===================== 罚款（6条，与数据库对齐） =====================
    let _fines = [
        { fineId: 1, borrowId: 8, amount: 3.50, paid: true, createDate: "2025-10-22", payDate: "2025-10-25" },
        { fineId: 2, borrowId: 9, amount: 2.50, paid: true, createDate: "2025-12-25", payDate: "2025-12-28" },
        { fineId: 3, borrowId: 10, amount: 4.00, paid: true, createDate: "2026-03-20", payDate: "2026-03-22" },
        { fineId: 4, borrowId: 15, amount: 3.00, paid: true, createDate: "2025-11-10", payDate: "2025-11-15" },
        { fineId: 5, borrowId: 21, amount: 1.20, paid: true, createDate: "2025-09-05", payDate: "2025-09-10" },
        { fineId: 6, borrowId: 23, amount: 4.00, paid: false, createDate: "2026-04-28", payDate: "" }
    ];
    let _nextFineId = 7;

    // ===================== 系统用户（20条，与数据库User表对齐） =====================
    let _users = loadUsers();
    function loadUsers() {
        const raw = localStorage.getItem("libraryUsers");
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { /* ignore */ }
        }
        return [
            // 系统管理员（不关联reader）
            { username: "admin", password: "admin123", role: "系统管理员", readerId: null },
            // 图书管理员（不关联reader）
            { username: "lib_manager1", password: "libmgr123", role: "图书管理员", readerId: null },
            { username: "lib_manager2", password: "libmgr456", role: "图书管理员", readerId: null },
            // 读者账号（关联reader_id）
            { username: "chensiyuan", password: "csy12345", role: "读者", readerId: 1 },
            { username: "linxiaotong", password: "lxt12345", role: "读者", readerId: 2 },
            { username: "wanghaoran", password: "whr12345", role: "读者", readerId: 3 },
            { username: "zhaoyuxuan", password: "zyx12345", role: "读者", readerId: 4 },
            { username: "liuzixuan", password: "lzx12345", role: "读者", readerId: 5 },
            { username: "zhangminghui", password: "zmh12345", role: "读者", readerId: 6 },
            { username: "libowen", password: "lbw12345", role: "读者", readerId: 7 },
            { username: "wusiqi", password: "wsq12345", role: "读者", readerId: 8 },
            { username: "zhoutianyu", password: "zty12345", role: "读者", readerId: 9 },
            { username: "sunyihan", password: "syh12345", role: "读者", readerId: 10 },
            { username: "majianguo", password: "mjg12345", role: "读者", readerId: 11 },
            { username: "huanglihua", password: "hlh12345", role: "读者", readerId: 12 },
            { username: "yangzhiqiang", password: "yzq12345", role: "读者", readerId: 13 },
            { username: "xujingyi", password: "xjy12345", role: "读者", readerId: 14 },
            { username: "zhengweiming", password: "zwm12345", role: "读者", readerId: 15 },
            { username: "hexiaofang", password: "hxf12345", role: "读者", readerId: 16 },
            { username: "qianxuelin", password: "qxl12345", role: "读者", readerId: 17 }
        ];
    }

    function saveUsers() { localStorage.setItem("libraryUsers", JSON.stringify(_users)); }

    // ===================== 邀请码（与数据库InviteCode表对齐） =====================
    let _inviteCodes = loadInviteCodes();
    let _nextInviteCodeId = (_inviteCodes.length > 0) ? Math.max(..._inviteCodes.map(c => c.id)) + 1 : 1;

    function loadInviteCodes() {
        const raw = localStorage.getItem("libraryInviteCodes");
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { /* ignore */ }
        }
        return [
            { id: 1, code: "ADMIN-2026-M3N4O5P6", targetRole: "系统管理员", maxUses: 3, usedCount: 0, active: true, createdBy: "admin", createdAt: "2026-06-01" },
            { id: 2, code: "LIB-2026-Q7R8S9T0", targetRole: "图书管理员", maxUses: 5, usedCount: 0, active: true, createdBy: "admin", createdAt: "2026-06-01" },
            { id: 3, code: "READ-2026-U1V2W3X4", targetRole: "读者", maxUses: 20, usedCount: 0, active: true, createdBy: "admin", createdAt: "2026-06-01" }
        ];
    }

    function saveInviteCodes() { localStorage.setItem("libraryInviteCodes", JSON.stringify(_inviteCodes)); }

    function validateInviteCode(code, role) {
        const entry = _inviteCodes.find(c =>
            c.code.toUpperCase() === code.toUpperCase() &&
            c.targetRole === role &&
            c.active === true
        );
        if (!entry) return { valid: false, reason: "邀请码无效或角色不匹配" };
        if (entry.maxUses > 0 && entry.usedCount >= entry.maxUses) {
            return { valid: false, reason: "该邀请码已达最大使用次数" };
        }
        return { valid: true, entry };
    }

    function consumeInviteCode(code, role) {
        const entry = _inviteCodes.find(c =>
            c.code.toUpperCase() === code.toUpperCase() &&
            c.targetRole === role &&
            c.active === true
        );
        if (entry) { entry.usedCount += 1; saveInviteCodes(); }
    }

    // ===================== 辅助方法 =====================
    function getAuthor(id) { return _authors.find(a => a.author_id === Number(id)); }
    function getPublisher(id) { return _publishers.find(p => p.publisher_id === Number(id)); }
    function getCategoryByName(name) { return _categories.find(c => c.category_name === name); }
    function getBook(id) { return _books.find(b => b.id === Number(id)); }
    function getReader(id) { return _readers.find(r => r.id === Number(id)); }
    function getBorrowRecord(id) { return _borrowRecords.find(r => r.borrowId === Number(id)); }
    function getRule(id) { return _rules.find(r => r.ruleId === Number(id)); }
    function getRuleForType(type) { return _rules.find(r => r.readerType === type) || _rules[0]; }
    function getFine(id) { return _fines.find(f => f.fineId === Number(id)); }

    function getOverdueRecords(todayStr) {
        const today = new Date(todayStr || new Date().toISOString().slice(0, 10));
        return _borrowRecords.filter(r => {
            if (r.borrowStatus === '已归还') return false;
            const due = new Date(r.dueDate);
            return due < today;
        });
    }

    function nextBookId() { return _nextBookId++; }
    function nextReaderId() { return _nextReaderId++; }
    function nextBorrowId() { return _nextBorrowId++; }
    function nextFineId() { return _nextFineId++; }
    function nextRuleId() { return _nextRuleId++; }

    function findUser(username, password, role) {
        return _users.find(u => u.username === username && u.password === password && u.role === role);
    }

    // ===================== 暴露API =====================
    return {
        // 作者/出版社/分类
        get authors() { return _authors; },
        get publishers() { return _publishers; },
        get categories() { return _categories; },
        set categories(v) { _categories = v; },
        getAuthor, getPublisher, getCategoryByName,

        // 邀请码
        get inviteCodes() { return _inviteCodes; },
        set inviteCodes(v) { _inviteCodes = v; saveInviteCodes(); },
        nextInviteCodeId() { return _nextInviteCodeId++; },
        validateInviteCode, consumeInviteCode,

        // 核心数据
        get books() { return _books; },
        set books(v) { _books = v; },
        get readers() { return _readers; },
        set readers(v) { _readers = v; },
        get borrowRecords() { return _borrowRecords; },
        set borrowRecords(v) { _borrowRecords = v; },
        get fines() { return _fines; },
        set fines(v) { _fines = v; },
        get rules() { return _rules; },
        set rules(v) { _rules = v; },
        get users() { return _users; },
        set users(v) { _users = v; saveUsers(); },

        // helper
        getBook, getReader, getBorrowRecord, getRule, getRuleForType, getFine,
        getOverdueRecords,
        nextBookId, nextReaderId, nextBorrowId, nextFineId, nextRuleId,
        findUser, saveUsers
    };
})();
