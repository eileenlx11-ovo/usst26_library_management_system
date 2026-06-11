/**
 * 图书馆管理系统 - 主业务逻辑
 * 合并前端B（多页面架构）和前端A（丰富功能），对接后端API
 */

// ===================== 会话管理 =====================

function getSession() {
    const raw = localStorage.getItem("librarySession");
    return raw ? JSON.parse(raw) : null;
}
function setSession(user) { localStorage.setItem("librarySession", JSON.stringify(user)); }
function clearSession() { localStorage.removeItem("librarySession"); }

// ===================== 登录/登出 =====================

function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;
    if (!username || !password) { showToast("用户名和密码不能为空。"); return; }
    const user = MockData.findUser(username, password, role);
    if (!user) { showToast("登录失败，请检查用户名、密码和角色是否匹配。"); return; }
    setSession(user);
    window.location.href = "index.html";
}

function logout() { clearSession(); window.location.href = "login.html"; }

// ===================== 角色权限 & 侧边栏 =====================

/** 页面对应的最低角色要求 */
const PAGE_ROLE_MAP = {
    "index.html": null,        // 所有人
    "books.html": null,        // 所有人（内容不同）
    "borrow.html": null,       // 所有人（内容不同）
    "readers.html": ["图书管理员", "系统管理员"],
    "report.html": ["系统管理员"],
    "admin.html": ["系统管理员"]
};

/** 检查页面访问权限，无权则跳转 */
function checkPageAccess(page) {
    const session = getSession();
    if (!session) { window.location.href = "login.html"; return false; }
    const allowed = PAGE_ROLE_MAP[page];
    if (allowed && !allowed.includes(session.role)) {
        showToast("您没有权限访问该页面");
        setTimeout(() => { window.location.href = "index.html"; }, 1500);
        return false;
    }
    return true;
}

/** 根据角色动态渲染侧边栏 */
function renderSidebar() {
    const session = getSession();
    if (!session) return;
    const role = session.role;
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    // 更新用户信息
    const avatarEl = document.getElementById("sidebarAvatar");
    const nameEl = document.getElementById("sidebarUserName");
    const roleEl = document.getElementById("sidebarUserRole");
    if (avatarEl) {
        if (session.avatar) {
            avatarEl.style.backgroundImage = `url('${session.avatar}')`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.innerText = "";
        } else {
            avatarEl.style.backgroundImage = "";
            avatarEl.innerText = session.username ? session.username[0].toUpperCase() : "?";
        }
    }
    if (nameEl) nameEl.innerText = session.username;
    if (roleEl) roleEl.innerText = session.role;

    // 构建导航项
    const navItems = [];
    navItems.push({ href: "index.html", icon: "📊", label: "总览" });

    if (role === "读者") {
        navItems.push({ href: "books.html", icon: "📖", label: "图书查询" });
        navItems.push({ href: "borrow.html", icon: "📋", label: "我的借阅" });
    } else {
        navItems.push({ href: "books.html", icon: "📖", label: "图书管理" });
        navItems.push({ href: "borrow.html", icon: "📋", label: "借阅管理" });
        navItems.push({ href: "readers.html", icon: "👥", label: "读者管理" });
    }

    if (role === "系统管理员") {
        navItems.push({ href: "report.html", icon: "📊", label: "统计报表" });
        navItems.push({ href: "admin.html", icon: "🔐", label: "系统安全" });
    }

    // 渲染导航
    const navList = document.querySelector(".nav-list");
    if (navList) {
        navList.innerHTML = navItems.map(item =>
            `<a href="${item.href}" class="nav-item${currentPage === item.href ? " active" : ""}">
                <span>${item.icon} ${item.label}</span>
            </a>`
        ).join("");
    }

    // 更新页面标题
    const found = navItems.find(n => n.href === currentPage);
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle && found) pageTitle.textContent = found.icon + " " + found.label;

    // 更新底部用户信息
    const footerInfo = document.getElementById("footerUserInfo");
    if (footerInfo) {
        footerInfo.innerText = `当前用户：${escapeHtml(session.username)}（${escapeHtml(session.role)}）`;
    }

    // 更新系统管理卡片可见性
    const adminCard = document.getElementById("adminCard");
    if (adminCard) {
        adminCard.style.display = role === "系统管理员" ? "block" : "none";
    }
}

// ===================== 工具函数 =====================

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function showToast(msg, timeout = 2200) {
    let el = document.getElementById("globalToast");
    if (!el) {
        el = document.createElement("div");
        el.id = "globalToast";
        el.className = "toast";
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), timeout);
}

function showConfirm(message) {
    return new Promise(resolve => {
        let modal = document.getElementById("globalConfirm");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "globalConfirm";
            modal.className = "confirm-modal";
            modal.innerHTML = `
                <div class="confirm-content">
                    <p class="confirm-message"></p>
                    <div class="confirm-buttons">
                        <button id="confirmCancel" class="ghost-btn">取消</button>
                        <button id="confirmOk" class="primary-btn">确定</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }
        modal.querySelector(".confirm-message").textContent = message;
        modal.style.display = "flex";
        function cleanup(result) {
            modal.style.display = "none";
            modal.querySelector("#confirmOk").removeEventListener("click", onOk);
            modal.querySelector("#confirmCancel").removeEventListener("click", onCancel);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        modal.querySelector("#confirmOk").addEventListener("click", onOk);
        modal.querySelector("#confirmCancel").addEventListener("click", onCancel);
    });
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function addDays(dateStr, days) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().slice(0, 10);
}

function daysBetween(start, end) {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return Math.floor((e - s) / 86400000);
}

// ===================== 个人信息弹窗 =====================

let pendingAvatarData = null;

function openProfileModal() {
    const session = getSession();
    if (!session) { showToast("请先登录。"); return; }
    document.getElementById("profileOldUsername").value = session.username;
    document.getElementById("profileUsername").value = session.username;
    document.getElementById("profilePassword").value = "";
    pendingAvatarData = null;
    const preview = document.getElementById("profileAvatarPreview");
    if (preview) {
        if (session.avatar) {
            preview.style.backgroundImage = `url('${session.avatar}')`;
            preview.innerText = "";
        } else {
            preview.style.backgroundImage = "";
            preview.innerText = session.username ? session.username[0].toUpperCase() : "?";
        }
    }
    document.getElementById("profileModal").style.display = "flex";
}

function closeProfileModal() {
    document.getElementById("profileModal").style.display = "none";
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        pendingAvatarData = e.target.result;
        const preview = document.getElementById("profileAvatarPreview");
        if (preview) {
            preview.style.backgroundImage = `url('${pendingAvatarData}')`;
            preview.innerText = "";
        }
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    const session = getSession();
    if (!session) { showToast("会话过期，请重新登录。"); window.location.href = "login.html"; return; }
    const oldUsername = document.getElementById("profileOldUsername").value.trim();
    const newUsername = document.getElementById("profileUsername").value.trim();
    const newPassword = document.getElementById("profilePassword").value;
    if (!newUsername) { showToast("用户名不能为空。"); return; }

    const users = MockData.users;
    const idx = users.findIndex(u => u.username === oldUsername && u.role === session.role);
    if (idx >= 0) {
        users[idx].username = newUsername;
        if (newPassword) users[idx].password = newPassword;
        if (pendingAvatarData) users[idx].avatar = pendingAvatarData;
    }
    session.username = newUsername;
    if (newPassword) session.password = newPassword;
    if (pendingAvatarData) session.avatar = pendingAvatarData;

    MockData.users = users;
    setSession(session);
    renderSidebar();
    closeProfileModal();
    showToast("个人信息已保存。");
}

// ===================== 分页渲染 =====================

function renderPagination(containerId, total, page, pageSize, changeFuncName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    if (pageCount <= 1) { container.innerHTML = ""; return; }
    let html = `<button onclick="${changeFuncName}(1)" ${page === 1 ? "disabled" : ""}>«</button>`;
    for (let i = 1; i <= pageCount; i++) {
        html += `<button class="${page === i ? "active" : ""}" onclick="${changeFuncName}(${i})">${i}</button>`;
    }
    html += `<button onclick="${changeFuncName}(${pageCount})" ${page === pageCount ? "disabled" : ""}>»</button>`;
    container.innerHTML = html;
}

// ==================== 仪表盘（index.html） ====================

function loadDashboard() {
    const session = getSession();
    if (!session) return;

    const books = MockData.books;
    const readers = MockData.readers;
    const records = MockData.borrowRecords;
    const fines = MockData.fines;
    const today = todayStr();

    // 计算指标
    let metricBooks = books.reduce((s, b) => s + (b.total || 0), 0);
    let metricAvailable = books.reduce((s, b) => s + (b.available || 0), 0);

    let activeRecords, unpaidFine;
    if (session.role === "读者") {
        const reader = readers.find(r => r.name === session.username) || readers[0];
        activeRecords = records.filter(r => r.readerId === reader.id && r.borrowStatus !== "已归还");
        unpaidFine = fines.filter(f => {
            const rec = records.find(r => r.borrowId === f.borrowId);
            return !f.paid && rec && rec.readerId === reader.id;
        }).reduce((s, f) => s + f.amount, 0);
    } else {
        activeRecords = records.filter(r => r.borrowStatus !== "已归还");
        unpaidFine = fines.filter(f => !f.paid).reduce((s, f) => s + f.amount, 0);
    }

    setMetric("metricBooks", metricBooks);
    setMetric("metricAvailable", metricAvailable);
    setMetric("metricBorrowing", activeRecords.length);
    setMetric("metricFine", unpaidFine.toFixed(2));

    // 待办事项
    const todos = buildTodoList(session, today);
    document.getElementById("todoCount").textContent = `${todos.length} 项`;
    document.getElementById("todoList").innerHTML = todos.length
        ? todos.map(t => `
            <div class="todo-item" onclick="location.href='${t.link}'" title="点击跳转到${t.type}相关页面">
                <div>
                    <strong>${escapeHtml(t.title)}</strong>
                    <span>${escapeHtml(t.detail)}</span>
                </div>
                <span class="tag">${escapeHtml(t.type)} <span class="goto-arrow">→</span></span>
            </div>`).join("")
        : `<div class="empty">暂无待处理事项</div>`;
}

function setMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function buildTodoList(session, today) {
    const todos = [];
    const overdue = MockData.getOverdueRecords(today);

    if (session.role !== "读者") {
        overdue.forEach(r => {
            const reader = MockData.getReader(r.readerId);
            const book = MockData.getBook(r.bookId);
            if (reader && book) {
                todos.push({ title: `${reader.name} 的图书已逾期`, detail: `${book.title}，逾期 ${daysBetween(r.dueDate, today)} 天`, type: "催还", link: "borrow.html" });
            }
        });
        MockData.books.filter(b => b.available <= 0).forEach(b => {
            todos.push({ title: `${b.title} 库存不足`, detail: "可借册数为0，建议补充", type: "库存", link: "books.html" });
        });
    } else {
        const reader = MockData.readers.find(r => r.name === session.username) || MockData.readers[0];
        overdue.filter(r => r.readerId === reader.id).forEach(r => {
            const book = MockData.getBook(r.bookId);
            if (book) todos.push({ title: `逾期提醒`, detail: `《${book.title}》已逾期 ${daysBetween(r.dueDate, today)} 天`, type: "催还", link: "borrow.html" });
        });
    }

    const unpaid = MockData.fines.filter(f => !f.paid);
    if (unpaid.length) todos.push({ title: "存在未缴罚款", detail: `共 ${unpaid.length} 条记录未缴纳`, type: "罚款", link: "borrow.html" });

    return todos.slice(0, 6);
}

// ==================== 图书管理（books.html） ====================

let bookSearchResults = null;
let currentBookPage = 1;
const BOOK_PAGE_SIZE = 8;

function loadBooks(page = 1) {
    currentBookPage = page;
    const source = bookSearchResults || MockData.books;
    const start = (page - 1) * BOOK_PAGE_SIZE;
    const items = source.slice(start, start + BOOK_PAGE_SIZE);
    const session = getSession();
    const isReader = session && session.role === "读者";

    const tbody = document.getElementById("bookListBody");
    if (!tbody) return;

    tbody.innerHTML = items.length ? items.map(book => `
        <tr>
            <td>${book.id}</td>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${escapeHtml(book.isbn)}</td>
            <td>${escapeHtml(book.publisher || "")}</td>
            <td>${escapeHtml(book.category)}</td>
            <td>${book.available || 0}/${book.total || 0}</td>
            <td><span class="status ${book.available > 0 ? 'ok' : 'bad'}">${book.available > 0 ? '可借' : '借空'}</span></td>
            <td>
                <div class="row-actions">
                    ${isReader ? `
                        <button class="small-btn" onclick="readerBorrowBook(${book.id})" ${book.available > 0 ? '' : 'disabled'}>借阅</button>
                    ` : `
                        <button class="small-btn secondary" onclick="editBook(${book.id})">编辑</button>
                        <button class="small-btn danger" onclick="deleteBook(${book.id})">删除</button>
                    `}
                </div>
            </td>
        </tr>`).join("") : `<tr><td colspan="9" class="empty">没有找到匹配的图书</td></tr>`;

    renderPagination("bookPagination", source.length, page, BOOK_PAGE_SIZE, "changeBookPage");

    // 渲染分类筛选
    const filter = document.getElementById("categoryFilter");
    if (filter && filter.options.length <= 1) {
        const current = filter.value;
        filter.innerHTML = '<option value="">全部分类</option>';
        MockData.categories.forEach(c => {
            filter.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
        });
        filter.value = current;
    }

    // 控制添加按钮可见性
    const addBtn = document.getElementById("addBookBtn");
    if (addBtn) addBtn.style.display = isReader ? "none" : "";
}

function changeBookPage(page) { loadBooks(page); }

function searchBooks() {
    const kw = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const cat = document.getElementById("categoryFilter")?.value || "";
    const avail = document.getElementById("availabilityFilter")?.value || "";

    let list = MockData.books;
    if (kw) list = list.filter(b => (b.title + b.author + b.isbn + b.category).toLowerCase().includes(kw));
    if (cat) list = list.filter(b => b.category === cat);
    if (avail === "available") list = list.filter(b => b.available > 0);
    if (avail === "empty") list = list.filter(b => b.available <= 0);

    bookSearchResults = list;
    loadBooks(1);
}

function openBookModal() {
    document.getElementById("modalTitle").textContent = "添加图书";
    document.getElementById("editBookId").value = "";
    ["bookTitle", "bookAuthor", "bookIsbn", "bookPublisher", "bookCategory"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("bookTotal").value = 1;
    document.getElementById("bookAvailable").value = 1;
    document.getElementById("bookModal").style.display = "flex";
}

function closeBookModal() { document.getElementById("bookModal").style.display = "none"; }

function editBook(id) {
    const book = MockData.getBook(id);
    if (!book) return;
    document.getElementById("modalTitle").textContent = "编辑图书";
    document.getElementById("editBookId").value = book.id;
    document.getElementById("bookTitle").value = book.title;
    document.getElementById("bookAuthor").value = book.author;
    document.getElementById("bookIsbn").value = book.isbn;
    document.getElementById("bookPublisher").value = book.publisher || "";
    document.getElementById("bookCategory").value = book.category;
    document.getElementById("bookTotal").value = book.total || 1;
    document.getElementById("bookAvailable").value = book.available || 0;
    document.getElementById("bookModal").style.display = "flex";
}

async function saveBook() {
    const id = Number(document.getElementById("editBookId").value) || 0;
    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    if (!title || !author) { showToast("书名和作者不能为空"); return; }

    const book = {
        id: id || MockData.nextBookId(),
        title, author,
        isbn: document.getElementById("bookIsbn").value.trim(),
        publisher: document.getElementById("bookPublisher").value.trim(),
        category: document.getElementById("bookCategory").value.trim(),
        total: Number(document.getElementById("bookTotal").value) || 1,
        available: Number(document.getElementById("bookAvailable").value) || 0,
        status: "在馆", borrowCount: 0
    };
    if (book.available > book.total) { showToast("可借册数不能大于总册数"); return; }
    if (!MockData.categories.includes(book.category)) MockData.categories.push(book.category);

    if (id) {
        const idx = MockData.books.findIndex(b => b.id === id);
        if (idx >= 0) { book.borrowCount = MockData.books[idx].borrowCount; MockData.books[idx] = book; }
    } else {
        MockData.books.push(book);
    }
    book.status = book.available > 0 ? "在馆" : "借空";
    closeBookModal();
    bookSearchResults = null;
    loadBooks(1);
    showToast("图书信息已保存。");
}

async function deleteBook(id) {
    if (!await showConfirm("确认删除该书吗？")) return;
    MockData.books = MockData.books.filter(b => b.id !== id);
    bookSearchResults = null;
    loadBooks(1);
    showToast("图书已删除。");
}

function readerBorrowBook(bookId) {
    const session = getSession();
    const reader = MockData.readers.find(r => r.name === session.username) || MockData.readers[0];
    if (!reader) { showToast("未找到读者信息"); return; }
    borrowBookDirect(reader.id, bookId);
}

// ==================== 借阅管理（borrow.html） ====================

async function borrowBookDirect(readerId, bookId) {
    const book = MockData.getBook(bookId);
    const reader = MockData.getReader(readerId);
    if (!book || !reader) { showToast("读者或图书不存在"); return; }
    if (reader.status && reader.status !== "正常") { showToast("读者状态异常，无法借阅"); return; }
    if (book.available <= 0) { showToast("该书无可借库存"); return; }

    const rule = MockData.getRuleForType(reader.type || "学生");
    const activeCount = MockData.borrowRecords.filter(r => r.readerId === readerId && r.borrowStatus !== "已归还").length;
    if (activeCount >= rule.maxBorrowCount) { showToast("已达最大借阅数量"); return; }

    // 尝试调用真实后端API
    const res = await borrowApi.lend(readerId, bookId);
    if (res.success) {
        // 后端成功，更新本地状态
        const record = {
            borrowId: MockData.nextBorrowId(),
            readerId, bookId, ruleId: rule.ruleId,
            borrowDate: todayStr(),
            dueDate: addDays(todayStr(), rule.maxBorrowDays),
            returnDate: "", renewedTimes: 0, overdueDays: 0,
            borrowStatus: "借阅中"
        };
        MockData.borrowRecords.push(record);
        book.available = Math.max(0, book.available - 1);
        book.borrowCount = (book.borrowCount || 0) + 1;
        book.status = book.available > 0 ? "在馆" : "借空";
        showToast(`借阅成功！《${book.title}》，应还日期 ${record.dueDate}`);
    } else {
        showToast("借阅失败：" + res.message);
    }
    refreshBorrowPage();
}

async function quickBorrow() {
    const cardId = document.getElementById("borrowReaderCard").value.trim();
    const bookId = Number(document.getElementById("borrowBookId").value);
    if (!cardId || !bookId) { showToast("请输入借书证号和图书编号"); return; }
    const reader = MockData.readers.find(r => r.cardId === cardId);
    if (!reader) { showToast("未找到该借书证号"); return; }
    await borrowBookDirect(reader.id, bookId);
    document.getElementById("borrowBookId").value = "";
}

async function returnBook(borrowId) {
    if (!await showConfirm("确认归还？系统将自动计算逾期费用。")) return;

    const res = await borrowApi.returnBook(borrowId);
    if (res.success) {
        const record = MockData.getBorrowRecord(borrowId);
        if (record) {
            const book = MockData.getBook(record.bookId);
            const today = todayStr();
            const overdueDays = Math.max(0, daysBetween(record.dueDate, today));
            record.returnDate = today;
            record.overdueDays = overdueDays;
            record.borrowStatus = "已归还";
            if (book) { book.available = Math.min(book.total || 0, (book.available || 0) + 1); book.status = book.available > 0 ? "在馆" : "借空"; }
            // 后端自动生成Fine，本地也模拟
            if (overdueDays > 0) {
                const rule = MockData.getRule(record.ruleId);
                if (rule && !MockData.fines.some(f => f.borrowId === borrowId)) {
                    MockData.fines.push({
                        fineId: MockData.nextFineId(), borrowId,
                        amount: Number((overdueDays * (rule.finePerDay || 0.5)).toFixed(2)),
                        paid: false, createDate: today, payDate: ""
                    });
                }
            }
            showToast(overdueDays > 0 ? `已归还，产生逾期费 ${(overdueDays * (MockData.getRule(record.ruleId)?.finePerDay || 0.5)).toFixed(2)} 元` : "归还成功！");
        } else {
            showToast(res.data || "归还成功！");
        }
    } else {
        showToast("归还失败：" + res.message);
    }
    refreshBorrowPage();
}

async function renewBook(borrowId) {
    if (!await showConfirm("确认续借该书？")) return;

    const res = await borrowApi.renew(borrowId);
    if (res.success) {
        const record = MockData.getBorrowRecord(borrowId);
        if (record) {
            const rule = MockData.getRule(record.ruleId);
            record.dueDate = addDays(record.dueDate, rule?.renewDays || 15);
            record.renewedTimes += 1;
        }
        showToast("续借成功！");
    } else {
        showToast("续借失败：" + res.message);
    }
    refreshBorrowPage();
}

async function notifyOverdue() {
    const res = await borrowApi.notifyOverdue();
    if (res.success) {
        showToast(res.data || "催还检查完成");
        loadBorrowRecords();
    } else {
        showToast("催还检查失败：" + res.message);
    }
}

function loadBorrowRecords(filterStatus = "") {
    // 先动态更新借阅状态（借阅中 → 逾期）
    MockData.borrowRecords.forEach(r => {
        if (r.borrowStatus !== "已归还" && daysBetween(r.dueDate, todayStr()) > 0) {
            r.borrowStatus = "逾期";
        } else if (r.borrowStatus !== "已归还" && daysBetween(r.dueDate, todayStr()) <= 0) {
            r.borrowStatus = "借阅中";
        }
    });

    const session = getSession();
    const tbody = document.getElementById("borrowListBody");
    if (!tbody) return;

    let records = MockData.borrowRecords;

    // 读者只看自己的
    if (session.role === "读者") {
        const reader = MockData.readers.find(r => r.name === session.username) || MockData.readers[0];
        records = records.filter(r => r.readerId === reader.id);
    }

    if (filterStatus) records = records.filter(r => r.borrowStatus === filterStatus);

    tbody.innerHTML = records.length ? records.map(r => {
        const reader = MockData.getReader(r.readerId);
        const book = MockData.getBook(r.bookId);
        const rule = MockData.getRule(r.ruleId) || { maxRenewTimes: 1 };
        const canRenew = r.borrowStatus !== "已归还" && r.renewedTimes < (rule.maxRenewTimes || 1) && daysBetween(r.dueDate, todayStr()) <= 0;
        const canReturn = r.borrowStatus !== "已归还";
        const sc = r.borrowStatus === "已归还" ? "ok" : r.borrowStatus === "逾期" ? "bad" : "warn";
        return `<tr>
            <td>${r.borrowId}</td>
            <td>${escapeHtml(reader?.name || "-")}<br><small>${escapeHtml(reader?.cardId || "")}</small></td>
            <td>${escapeHtml(book?.title || "-")}</td>
            <td>${r.borrowDate}</td>
            <td>${r.dueDate}</td>
            <td><span class="status ${sc}">${r.borrowStatus}${daysBetween(r.dueDate, todayStr()) > 0 && r.borrowStatus !== '已归还' ? ' ' + daysBetween(r.dueDate, todayStr()) + '天' : ''}</span></td>
            <td>${r.renewedTimes}/${rule.maxRenewTimes || 1}</td>
            <td>
                <div class="row-actions">
                    <button class="small-btn secondary" onclick="renewBook(${r.borrowId})" ${canRenew ? '' : 'disabled'}>续借</button>
                    <button class="small-btn warning" onclick="returnBook(${r.borrowId})" ${canReturn ? '' : 'disabled'}>归还</button>
                </div>
            </td>
        </tr>`;
    }).join("") : `<tr><td colspan="8" class="empty">暂无借阅记录</td></tr>`;

    // 罚款表
    renderFines(session);
    // 规则摘要（非读者）
    renderRuleSummary(session);
}

function renderFines(session) {
    const tbody = document.getElementById("fineTableBody");
    if (!tbody) return;
    let fines = MockData.fines;
    if (session.role === "读者") {
        const reader = MockData.readers.find(r => r.name === session.username) || MockData.readers[0];
        fines = fines.filter(f => {
            const rec = MockData.getBorrowRecord(f.borrowId);
            return rec && rec.readerId === reader.id;
        });
    }
    tbody.innerHTML = fines.length ? fines.map(f => `
        <tr>
            <td>${f.fineId}</td>
            <td>${f.borrowId}</td>
            <td>${f.amount.toFixed(2)} 元</td>
            <td>${f.createDate || "-"}</td>
            <td><span class="status ${f.paid ? 'ok' : 'bad'}">${f.paid ? '已缴纳' : '未缴纳'}</span></td>
            <td><button class="small-btn" onclick="payFine(${f.fineId})" ${f.paid ? 'disabled' : ''}>缴纳</button></td>
        </tr>`).join("") : `<tr><td colspan="6" class="empty">暂无罚款记录</td></tr>`;
}

function renderRuleSummary(session) {
    const el = document.getElementById("ruleSummary");
    if (!el) return;
    if (session.role === "读者") { el.innerHTML = ""; return; }
    const rule = MockData.rules[0];
    if (!rule) { el.innerHTML = ""; return; }
    el.innerHTML = `
        <div><strong>${rule.maxBorrowDays} 天</strong><span>最大借阅天数</span></div>
        <div><strong>${rule.maxBorrowCount} 本</strong><span>最大借阅数量</span></div>
        <div><strong>${(rule.finePerDay || 0).toFixed(2)} 元/天</strong><span>每日逾期费</span></div>
        <div><strong>${rule.maxRenewTimes || 0} 次</strong><span>最大续借次数</span></div>
        <div><strong>${rule.renewDays || 0} 天</strong><span>每次续借天数</span></div>
        <div><span>学生规则</span></div>`;
}

function payFine(fineId) {
    const fine = MockData.getFine(fineId);
    if (!fine || fine.paid) return;
    fine.paid = true;
    fine.payDate = todayStr();
    refreshBorrowPage();
    showToast("罚款已标记为已缴纳");
}

function refreshBorrowPage() {
    const filter = document.getElementById("recordStatusFilter")?.value || "";
    loadBorrowRecords(filter);
}

// ==================== 读者管理（readers.html） ====================

let readerSearchResults = null;
let currentReaderPage = 1;
const READER_PAGE_SIZE = 8;

function loadReaders(page = 1) {
    currentReaderPage = page;
    const source = readerSearchResults || MockData.readers;
    const start = (page - 1) * READER_PAGE_SIZE;
    const items = source.slice(start, start + READER_PAGE_SIZE);

    const tbody = document.getElementById("readerListBody");
    if (!tbody) return;

    tbody.innerHTML = items.length ? items.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${escapeHtml(r.cardId)}</td>
            <td>${escapeHtml(r.name)}</td>
            <td>${escapeHtml(r.gender || "")}</td>
            <td>${escapeHtml(r.phone)}</td>
            <td>${escapeHtml(r.email || "")}</td>
            <td>${escapeHtml(r.type || "学生")}</td>
            <td><span class="status ${r.status === '正常' ? 'ok' : 'bad'}">${escapeHtml(r.status || '正常')}</span></td>
            <td>
                <div class="row-actions">
                    <button class="small-btn secondary" onclick="editReader(${r.id})">编辑</button>
                    <button class="small-btn danger" onclick="deleteReader(${r.id})">删除</button>
                </div>
            </td>
        </tr>`).join("") : `<tr><td colspan="9" class="empty">暂无读者数据</td></tr>`;

    renderPagination("readerPagination", source.length, page, READER_PAGE_SIZE, "changeReaderPage");
}

function changeReaderPage(page) { loadReaders(page); }

function searchReaders() {
    const kw = (document.getElementById("readerSearch")?.value || "").toLowerCase();
    readerSearchResults = MockData.readers.filter(r => (r.name + r.cardId).toLowerCase().includes(kw));
    loadReaders(1);
}

function openReaderModal() {
    document.getElementById("readerModalTitle").textContent = "添加读者";
    document.getElementById("editReaderId").value = "";
    ["readerCardId", "readerName", "readerGender", "readerPhone", "readerEmail", "readerType", "readerStatus"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === "readerGender") el.value = "男";
            else if (id === "readerType") el.value = "学生";
            else if (id === "readerStatus") el.value = "正常";
            else el.value = "";
        }
    });
    document.getElementById("readerModal").style.display = "flex";
}

function closeReaderModal() { document.getElementById("readerModal").style.display = "none"; }

function editReader(id) {
    const r = MockData.getReader(id);
    if (!r) return;
    document.getElementById("readerModalTitle").textContent = "编辑读者";
    document.getElementById("editReaderId").value = r.id;
    document.getElementById("readerCardId").value = r.cardId;
    document.getElementById("readerName").value = r.name;
    document.getElementById("readerGender").value = r.gender || "男";
    document.getElementById("readerPhone").value = r.phone;
    document.getElementById("readerEmail").value = r.email || "";
    document.getElementById("readerType").value = r.type || "学生";
    document.getElementById("readerStatus").value = r.status || "正常";
    document.getElementById("readerModal").style.display = "flex";
}

function saveReader() {
    const id = Number(document.getElementById("editReaderId").value) || 0;
    const cardId = document.getElementById("readerCardId").value.trim();
    const name = document.getElementById("readerName").value.trim();
    if (!cardId || !name) { showToast("借书证号和姓名不能为空"); return; }

    // 检查重复
    if (MockData.readers.some(r => r.cardId === cardId && r.id !== id)) {
        showToast("借书证号已存在"); return;
    }

    const reader = {
        id: id || MockData.nextReaderId(),
        cardId, name,
        gender: document.getElementById("readerGender")?.value || "男",
        phone: document.getElementById("readerPhone")?.value.trim() || "",
        email: document.getElementById("readerEmail")?.value.trim() || "",
        type: document.getElementById("readerType")?.value || "学生",
        registerDate: todayStr(),
        status: document.getElementById("readerStatus")?.value || "正常"
    };

    if (id) {
        const idx = MockData.readers.findIndex(r => r.id === id);
        if (idx >= 0) { reader.registerDate = MockData.readers[idx].registerDate; MockData.readers[idx] = reader; }
    } else {
        MockData.readers.push(reader);
    }
    closeReaderModal();
    readerSearchResults = null;
    loadReaders(1);
    showToast("读者信息已保存。");
}

async function deleteReader(id) {
    if (!await showConfirm("确认删除该读者吗？")) return;
    MockData.readers = MockData.readers.filter(r => r.id !== id);
    readerSearchResults = null;
    loadReaders(1);
    showToast("读者已删除。");
}

// ==================== 统计报表（report.html） ====================

function loadReports() {
    const books = MockData.books;
    const records = MockData.borrowRecords;
    const readers = MockData.readers;

    // 热门图书柱状图
    const hotBody = document.getElementById("hotBookBars");
    if (hotBody) {
        const sorted = [...books].sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0)).slice(0, 10);
        const max = Math.max(...sorted.map(b => b.borrowCount || 0), 1);
        hotBody.innerHTML = sorted.map(b => {
            const w = Math.round((b.borrowCount || 0) / max * 100);
            return `<div class="bar-row"><strong>${escapeHtml(b.title)}</strong><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span>${b.borrowCount || 0}</span></div>`;
        }).join("");
    }

    // 活跃读者柱状图
    const activeBody = document.getElementById("activeReaderBars");
    if (activeBody) {
        const map = new Map();
        records.forEach(r => { map.set(r.readerId, (map.get(r.readerId) || 0) + 1); });
        const sorted = readers.map(r => ({ reader: r, count: map.get(r.id) || 0 })).sort((a, b) => b.count - a.count);
        const max = Math.max(...sorted.map(s => s.count), 1);
        activeBody.innerHTML = sorted.map(s => {
            const w = Math.round(s.count / max * 100);
            return `<div class="bar-row"><strong>${escapeHtml(s.reader.name)}</strong><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span>${s.count}</span></div>`;
        }).join("");
    }

    // 逾期催还名单
    const overdueBody = document.getElementById("overdueTableBody");
    if (overdueBody) {
        const today = todayStr();
        const overdue = MockData.getOverdueRecords(today);
        overdueBody.innerHTML = overdue.length ? overdue.map(r => {
            const reader = MockData.getReader(r.readerId);
            const book = MockData.getBook(r.bookId);
            const rule = MockData.getRule(r.ruleId);
            const days = daysBetween(r.dueDate, today);
            return `<tr>
                <td>${escapeHtml(reader?.name || "-")}</td>
                <td>${escapeHtml(reader?.phone || "-")}</td>
                <td>${escapeHtml(book?.title || "-")}</td>
                <td>${r.dueDate}</td>
                <td>${days}</td>
                <td>${(days * (rule?.finePerDay || 0.5)).toFixed(2)} 元</td>
            </tr>`;
        }).join("") : `<tr><td colspan="6" class="empty">暂无逾期记录</td></tr>`;
    }

    // 更新今日日期
    const todayEl = document.getElementById("todayText");
    if (todayEl) todayEl.textContent = `今天：${todayStr()}`;
}

// ==================== 系统安全（admin.html） ====================

function loadAdminData() {
    // 用户权限
    const roleBody = document.getElementById("roleListBody");
    if (roleBody) {
        const users = MockData.users;
        roleBody.innerHTML = users.map((u, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(u.role)}</td>
                <td>
                    <div class="row-actions">
                        <button class="small-btn secondary" onclick="editRole('${escapeHtml(u.username)}')">编辑</button>
                        <button class="small-btn danger" onclick="deleteRole('${escapeHtml(u.username)}')">删除</button>
                    </div>
                </td>
            </tr>`).join("");
    }

    // 分类chip
    const chipList = document.getElementById("categoryChipList");
    if (chipList) {
        chipList.innerHTML = MockData.categories.map(c => `
            <span class="chip">${escapeHtml(c)}<button onclick="deleteCategory('${escapeHtml(c)}')">×</button></span>
        `).join("");
    }

    // 规则设置
    const rule = MockData.rules[0];
    if (rule) {
        const fields = { maxBorrow: rule.maxBorrowCount, borrowDays: rule.maxBorrowDays, overdueFee: rule.finePerDay, maxRenewTimes: rule.maxRenewTimes, renewDays: rule.renewDays };
        Object.entries(fields).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        });
    }
}

function openRoleModal(username) {
    const modal = document.getElementById("roleModal");
    document.getElementById("roleModalTitle").textContent = username ? "编辑用户权限" : "新增用户权限";
    document.getElementById("editRoleUsername").value = username || "";
    document.getElementById("roleUsername").value = username || "";
    document.getElementById("roleType").value = "图书管理员";
    if (username) {
        const user = MockData.users.find(u => u.username === username);
        if (user) document.getElementById("roleType").value = user.role;
    }
    modal.style.display = "flex";
}

function closeRoleModal() { document.getElementById("roleModal").style.display = "none"; }

function saveRole() {
    const oldUsername = document.getElementById("editRoleUsername").value.trim();
    const username = document.getElementById("roleUsername").value.trim();
    const role = document.getElementById("roleType").value;
    if (!username) { showToast("用户名不能为空"); return; }

    const users = MockData.users;
    const idx = users.findIndex(u => u.username === oldUsername);
    if (idx >= 0) {
        users[idx] = { ...users[idx], username, role };
    } else {
        if (users.find(u => u.username === username)) { showToast("用户名已存在"); return; }
        users.push({ username, password: "123456", role });
    }
    MockData.users = users;
    closeRoleModal();
    loadAdminData();
    showToast("用户权限已保存。");
}

function editRole(username) { openRoleModal(username); }

async function deleteRole(username) {
    if (!await showConfirm("确认删除该用户权限记录吗？")) return;
    MockData.users = MockData.users.filter(u => u.username !== username);
    loadAdminData();
    showToast("已删除。");
}

function openCategoryModal() { /* 简化为直接添加 */ }

async function deleteCategory(name) {
    if (!await showConfirm("确认删除该分类吗？")) return;
    MockData.categories = MockData.categories.filter(c => c !== name);
    loadAdminData();
    showToast("分类已删除。");
}

function addCategory() {
    const input = document.getElementById("newCategory");
    const name = input.value.trim();
    if (!name) { showToast("请输入分类名称"); return; }
    if (MockData.categories.includes(name)) { showToast("分类已存在"); return; }
    MockData.categories.push(name);
    input.value = "";
    loadAdminData();
    showToast("分类已添加。");
}

function saveBorrowRules() {
    const maxBorrowCount = Number(document.getElementById("maxBorrow")?.value) || 5;
    const maxBorrowDays = Number(document.getElementById("borrowDays")?.value) || 30;
    const finePerDay = Number(document.getElementById("overdueFee")?.value) || 0.5;
    const maxRenewTimes = Number(document.getElementById("maxRenewTimes")?.value) || 1;
    const renewDays = Number(document.getElementById("renewDays")?.value) || 15;

    const rule = MockData.rules[0];
    if (rule) {
        rule.maxBorrowCount = maxBorrowCount;
        rule.maxBorrowDays = maxBorrowDays;
        rule.finePerDay = finePerDay;
        rule.maxRenewTimes = maxRenewTimes;
        rule.renewDays = renewDays;
    }
    loadAdminData();
    showToast("借阅规则已保存。");
}

function backupData() {
    const data = {
        books: MockData.books, readers: MockData.readers,
        borrowRecords: MockData.borrowRecords, fines: MockData.fines,
        rules: MockData.rules, categories: MockData.categories, users: MockData.users
    };
    localStorage.setItem("libraryBackup", JSON.stringify(data));
    showToast("数据已备份到本地存储。");
}

async function restoreDemoData() {
    if (!await showConfirm("确认恢复演示数据？当前数据将被覆盖。")) return;
    const raw = localStorage.getItem("libraryBackup");
    if (!raw) { showToast("未找到备份数据"); return; }
    try {
        const data = JSON.parse(raw);
        MockData.books = data.books;
        MockData.readers = data.readers;
        MockData.borrowRecords = data.borrowRecords;
        MockData.fines = data.fines;
        MockData.rules = data.rules;
        MockData.categories = data.categories;
        MockData.users = data.users;
        showToast("数据已恢复。");
        loadAdminData();
    } catch (e) { showToast("恢复失败"); }
}

// ==================== 角色可见性控制 ====================

function applyRoleVisibility(page) {
    const session = getSession();
    if (!session) return;
    const role = session.role;
    const isReader = role === "读者";

    if (page === "borrow.html") {
        // 管理员区域（快速借阅+规则摘要）仅管理员可见
        const adminSection = document.getElementById("adminBorrowSection");
        if (adminSection) adminSection.style.display = isReader ? "none" : "";
        // 催还按钮仅管理员可见
        const notifyBtn = document.getElementById("notifyBtn");
        if (notifyBtn) notifyBtn.style.display = isReader ? "none" : "";
    }

    if (page === "books.html") {
        const addBtn = document.getElementById("addBookBtn");
        if (addBtn) addBtn.style.display = isReader ? "none" : "";
    }
}

// ==================== 页面初始化 ====================

document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname.split("/").pop() || "index.html";

    // 登录页特殊处理
    if (path === "login.html") {
        if (getSession()) { window.location.href = "index.html"; }
        return;
    }

    // 权限检查
    if (!checkPageAccess(path)) return;

    // 渲染侧边栏
    renderSidebar();

    // 角色可见性控制
    applyRoleVisibility(path);

    // 加载对应页面数据
    switch (path) {
        case "index.html":
            loadDashboard();
            break;
        case "books.html":
            loadBooks(1);
            // 绑定事件
            document.getElementById("searchInput")?.addEventListener("input", searchBooks);
            document.getElementById("categoryFilter")?.addEventListener("change", searchBooks);
            document.getElementById("availabilityFilter")?.addEventListener("change", searchBooks);
            break;
        case "borrow.html":
            refreshBorrowPage();
            document.getElementById("recordStatusFilter")?.addEventListener("change", function () {
                loadBorrowRecords(this.value);
            });
            document.getElementById("borrowForm")?.addEventListener("submit", function (e) {
                e.preventDefault();
                quickBorrow();
            });
            // 填充读者datalist
            const datalist = document.getElementById("readerCards");
            if (datalist) {
                datalist.innerHTML = MockData.readers.map(r =>
                    `<option value="${escapeHtml(r.cardId)}">${escapeHtml(r.name)}</option>`
                ).join("");
            }
            break;
        case "readers.html":
            loadReaders(1);
            break;
        case "report.html":
            loadReports();
            break;
        case "admin.html":
            loadAdminData();
            break;
    }
});

// 全局函数暴露
window.login = login;
window.logout = logout;
window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfile = saveProfile;
window.handleAvatarUpload = handleAvatarUpload;
window.openBookModal = openBookModal;
window.closeBookModal = closeBookModal;
window.saveBook = saveBook;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.searchBooks = searchBooks;
window.changeBookPage = changeBookPage;
window.readerBorrowBook = readerBorrowBook;
window.quickBorrow = quickBorrow;
window.returnBook = returnBook;
window.renewBook = renewBook;
window.notifyOverdue = notifyOverdue;
window.payFine = payFine;
window.searchReaders = searchReaders;
window.openReaderModal = openReaderModal;
window.closeReaderModal = closeReaderModal;
window.saveReader = saveReader;
window.editReader = editReader;
window.deleteReader = deleteReader;
window.changeReaderPage = changeReaderPage;
window.openRoleModal = openRoleModal;
window.closeRoleModal = closeRoleModal;
window.saveRole = saveRole;
window.editRole = editRole;
window.deleteRole = deleteRole;
window.deleteCategory = deleteCategory;
window.addCategory = addCategory;
window.saveBorrowRules = saveBorrowRules;
window.backupData = backupData;
window.restoreDemoData = restoreDemoData;
