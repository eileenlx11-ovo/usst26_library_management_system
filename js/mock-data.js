/**
 * Mock数据层 - 后端接口未就绪时的本地数据回退
 * 合并了前端B和前端A的种子数据，统一数据模型
 */

const MockData = (function () {
    // ===================== 图书 =====================
    let _books = [
        { id: 1, title: "数据库系统概论", author: "王珊", isbn: "9787111123456", publisher: "高等教育出版社", category: "计算机", total: 6, available: 4, status: "在馆", borrowCount: 12 },
        { id: 2, title: "深入理解计算机系统", author: "Randal E. Bryant", isbn: "9787111544934", publisher: "机械工业出版社", category: "计算机", total: 3, available: 1, status: "在馆", borrowCount: 9 },
        { id: 3, title: "三体", author: "刘慈欣", isbn: "9787229030933", publisher: "重庆出版社", category: "文学", total: 5, available: 0, status: "借空", borrowCount: 18 },
        { id: 4, title: "人类简史", author: "尤瓦尔·赫拉利", isbn: "9787508649719", publisher: "中信出版社", category: "历史", total: 4, available: 2, status: "在馆", borrowCount: 7 },
        { id: 5, title: "管理信息系统", author: "薛华成", isbn: "9787302423287", publisher: "清华大学出版社", category: "管理", total: 4, available: 3, status: "在馆", borrowCount: 5 }
    ];
    let _nextBookId = 6;

    // ===================== 读者 =====================
    let _readers = [
        { id: 1, cardId: "R2026001", name: "张同学", gender: "男", phone: "13800000001", email: "zhang@example.com", type: "学生", registerDate: "2026-05-01", status: "正常" },
        { id: 2, cardId: "R2026002", name: "李老师", gender: "女", phone: "13800000002", email: "li@example.com", type: "教师", registerDate: "2026-05-02", status: "正常" },
        { id: 3, cardId: "R2026003", name: "陈同学", gender: "女", phone: "13800000003", email: "chen@example.com", type: "学生", registerDate: "2026-05-08", status: "正常" }
    ];
    let _nextReaderId = 4;

    // ===================== 借阅记录 =====================
    let _borrowRecords = [
        { borrowId: 1, readerId: 1, bookId: 1, ruleId: 1, borrowDate: "2026-05-10", dueDate: "2026-06-09", returnDate: "", renewedTimes: 0, borrowStatus: "借阅中" },
        { borrowId: 2, readerId: 1, bookId: 3, ruleId: 1, borrowDate: "2026-04-20", dueDate: "2026-05-20", returnDate: "", renewedTimes: 1, borrowStatus: "逾期" },
        { borrowId: 3, readerId: 2, bookId: 4, ruleId: 2, borrowDate: "2026-04-01", dueDate: "2026-05-31", returnDate: "2026-06-05", renewedTimes: 0, overdueDays: 5, borrowStatus: "已归还" }
    ];
    let _nextBorrowId = 4;

    // ===================== 罚款 =====================
    let _fines = [
        { fineId: 1, borrowId: 3, amount: 1.5, paid: false, createDate: "2026-06-05", payDate: "" }
    ];
    let _nextFineId = 2;

    // ===================== 借阅规则 =====================
    let _rules = [
        { ruleId: 1, readerType: "学生", maxBorrowDays: 30, maxBorrowCount: 5, finePerDay: 0.5, maxRenewTimes: 1, renewDays: 15 },
        { ruleId: 2, readerType: "教师", maxBorrowDays: 60, maxBorrowCount: 10, finePerDay: 0.3, maxRenewTimes: 2, renewDays: 30 }
    ];
    let _nextRuleId = 3;

    // ===================== 分类 =====================
    let _categories = ["计算机", "文学", "管理", "科普", "历史", "科幻"];

    // ===================== 用户（登录用） =====================
    let _users = loadUsers();
    function loadUsers() {
        const raw = localStorage.getItem("libraryUsers");
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { /* ignore */ }
        }
        return [
            { username: "admin", password: "123456", role: "系统管理员" },
            { username: "manager01", password: "123456", role: "图书管理员" },
            { username: "reader01", password: "123456", role: "读者" }
        ];
    }

    function saveUsers() {
        localStorage.setItem("libraryUsers", JSON.stringify(_users));
    }

    // ===================== 辅助方法 =====================

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
        // getter/setter
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
        get categories() { return _categories; },
        set categories(v) { _categories = v; },
        get users() { return _users; },
        set users(v) { _users = v; saveUsers(); },

        // helper
        getBook, getReader, getBorrowRecord, getRule, getRuleForType, getFine,
        getOverdueRecords,
        nextBookId, nextReaderId, nextBorrowId, nextFineId, nextRuleId,
        findUser, saveUsers
    };
})();
