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

async function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;
    if (!username || !password) { showToast("用户名和密码不能为空。"); return; }

    // 只走后端 API，不再回退本地
    const res = await authApi.login(username, password, role);
    if (res.success && res.data) {
        setSession({ username: res.data.username, role: res.data.role, readerId: res.data.readerId, userId: res.data.userId });
        window.location.href = "index.html";
        return;
    }

    if (res.message === '网络错误' || res.message.includes('无法连接')) {
        showToast("后端未启动，请先在IDEA中运行LibrarySystemApplication。");
    } else {
        showToast(res.message || "登录失败");
    }
}

function logout() { clearSession(); window.location.href = "login.html"; }

// ===================== 注册 =====================

function showRegisterForm() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "";
    document.getElementById("regRole").value = "读者";
    onRegRoleChange();
}

function showLoginForm() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "";
    // 清空注册表单
    ["regUsername", "regPassword", "regPasswordConfirm", "regInviteCode"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

function onRegRoleChange() {
    const role = document.getElementById("regRole").value;
    const inviteSection = document.getElementById("inviteCodeSection");
    const readerFields = document.getElementById("readerExtraFields");
    if (inviteSection) inviteSection.style.display = role === "读者" ? "none" : "";
    if (readerFields) readerFields.style.display = role === "读者" ? "" : "none";
}

async function register() {
    const role = document.getElementById("regRole").value;
    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;
    if (!username || !password) { showToast("用户名和密码不能为空。"); return; }
    if (!/^[a-zA-Z0-9一-龥]{2,16}$/.test(username)) { showToast("用户名需为2-16位字母、数字或中文。"); return; }
    if (password.length < 4) { showToast("密码长度不能少于4位。"); return; }
    if (password !== passwordConfirm) { showToast("两次输入的密码不一致。"); return; }

    // 读者额外信息
    const readerName = role === "读者" ? (document.getElementById("regReaderName")?.value.trim() || username) : "";
    const readerGender = document.getElementById("regReaderGender")?.value || "男";
    const readerPhone = document.getElementById("regReaderPhone")?.value.trim() || "";
    const readerType = document.getElementById("regReaderType")?.value || "本科生";

    const inviteCode = role !== "读者" ? document.getElementById("regInviteCode")?.value.trim() || "" : "";
    const res = await authApi.register(username, password, role, inviteCode, readerName, readerGender, readerPhone, readerType);
    if (res.success) {
        showToast("注册成功！欢迎，" + role + "「" + username + "」。");
        setTimeout(() => { showLoginForm(); document.getElementById("loginUsername").value = username; }, 2000);
    } else { showToast(res.message || "注册失败"); }
}

function generateInviteCode() {
    const role = document.getElementById("inviteCodeRole").value;
    const maxUses = parseInt(document.getElementById("inviteCodeMaxUses").value) || 0;
    inviteApi.generate(role, maxUses || 1, 365).then(res => {
        if (res.success && res.data) {
            showToast("邀请码已生成：" + res.data.code);
            loadAdminData();
        } else showToast("生成失败");
    });
}

async function revokeInviteCode(codeId) {
    const res = await inviteApi.revoke(codeId);
    if (res.success) { showToast("已吊销"); loadAdminData(); }
    else showToast("操作失败");
}

async function renderInviteCodeList() {
    const tbody = document.getElementById("inviteCodeListBody");
    if (!tbody) return;
    const res = await inviteApi.list();
    const codes = (res.success && res.data) ? res.data : [];
    tbody.innerHTML = codes.length ? codes.map(c => `
        <tr><td><code style="font-weight:700;letter-spacing:1px;">${escapeHtml(c.code)}</code></td>
            <td>${escapeHtml(c.role)}</td><td>${c.isUsed?'已使用':'未使用'}</td>
            <td><span class="status ${c.isUsed?'bad':'ok'}">${c.isUsed?'已用':'有效'}</span></td>
            <td>${c.createTime||''}</td><td>${c.expireTime||''}</td>
            <td><button class="small-btn ${c.isUsed?'secondary':'warning'}" onclick="revokeInviteCode(${c.codeId})" ${c.isUsed?'disabled':''}>${c.isUsed?'已用':'吊销'}</button></td></tr>
    `).join("") : `<tr><td colspan="7" class="empty">暂无邀请码，请使用下方表单生成</td></tr>`;
}

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
    // 显示读者ID
    const ridEl = document.getElementById("profileReaderId");
    if (ridEl) ridEl.textContent = session.role === '读者' && session.readerId ? '读者ID: ' + session.readerId : '';
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

async function saveProfile() {
    const session = getSession();
    if (!session) { showToast("会话过期，请重新登录。"); window.location.href = "login.html"; return; }
    const newUsername = document.getElementById("profileUsername").value.trim();
    const newPassword = document.getElementById("profilePassword").value;
    if (!newUsername) { showToast("用户名不能为空。"); return; }

    // 同时更新 localStorage 和数据库
    const users = MockData.users;
    const idx = users.findIndex(u => u.username === session.username && u.role === session.role);
    if (idx >= 0) {
        users[idx].username = newUsername;
        if (newPassword) users[idx].password = newPassword;
        if (pendingAvatarData) users[idx].avatar = pendingAvatarData;
    }
    MockData.users = users;
    session.username = newUsername;
    if (newPassword) session.password = newPassword;
    if (pendingAvatarData) session.avatar = pendingAvatarData;
    setSession(session);

    // 同步到数据库 User 表
    const res = await adminApi.updateUser({
        userId: session.userId,
        username: newUsername,
        role: session.role,
        isActive: true
    });

    renderSidebar();
    closeProfileModal();
    if (res.success) {
        showToast("个人信息已保存（数据库已同步）。");
    } else {
        showToast("个人信息已保存（仅本地——数据库更新失败：" + (res.message || '后端未启动') + "）");
    }
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

let bookUseApi = true;
let currentBookSearchParams = {};

async function loadDashboard() {
    const session = getSession();
    if (!session) return;

    // 1. 馆藏量 — 从图书分页API拿total
    let totalBooks = 0, totalAvailable = 0;
    const bookRes = await bookApi.list({ pageNum: 1, pageSize: 1 });
    if (bookRes.success && bookRes.data && bookRes.data.total) {
        totalBooks = bookRes.data.total;
        const allRes = await bookApi.list({ pageNum: 1, pageSize: 200 });
        if (allRes.success && allRes.data && allRes.data.records) {
            totalAvailable = allRes.data.records.reduce((s, b) => s + (b.available || 0), 0);
        }
    }

    // 2. 借阅中数量 — 从借阅API
    let activeCount = 0, unpaidFine = 0;
    const isReader = session.role === "读者";
    const borrowRes = await apiGet('/bookadmin/borrow/list');
    if (borrowRes.success && borrowRes.data) {
        let records = borrowRes.data;
        if (isReader && session.readerId) {
            records = records.filter(r => r.readerId === session.readerId);
        }
        activeCount = records.filter(r => r.borrowStatus !== "已归还").length;
    }

    // 3. 待缴罚款 = Fine表中未缴纳的实际金额
    const fineRes = await apiGet('/bookadmin/borrow/fines');
    if (fineRes.success && fineRes.data) {
        let fines = fineRes.data;
        if (isReader && session.readerId) {
            fines = fines.filter(f => f.readerId === session.readerId);
        }
        unpaidFine = fines.filter(f => !f.isPaid).reduce((s, f) => s + (parseFloat(f.fineAmount) || 0), 0);
    }

    // 读者重命名指标卡片
    if (isReader) {
        document.querySelector(".metric-card:nth-child(1) span").textContent = "馆藏总量";
        document.querySelector(".metric-card:nth-child(3) strong").parentElement.querySelector("span").textContent = "我的借阅中";
        document.querySelector(".metric-card:nth-child(4) strong").parentElement.querySelector("span").textContent = "我的待缴罚款";
    }
    setMetric("metricBooks", totalBooks || MockData.books.reduce((s,b)=>s+(b.total||0),0));
    setMetric("metricAvailable", totalAvailable || MockData.books.reduce((s,b)=>s+(b.available||0),0));
    setMetric("metricBorrowing", activeCount);
    setMetric("metricFine", unpaidFine.toFixed(2));

    const todos = await buildTodoList(session, todayStr());
    document.getElementById("todoCount").textContent = `${todos.length} 项`;
    document.getElementById("todoList").innerHTML = todos.length
        ? todos.map(t => `<div class="todo-item" onclick="location.href='${t.link}'"><div><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.detail)}</span></div><span class="tag">${escapeHtml(t.type)} <span class="goto-arrow">→</span></span></div>`).join("")
        : `<div class="empty">暂无待处理事项</div>`;
}

function setMetric(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function buildTodoList(session, today) {
    const todos = [];

    // 1. 逾期催还 — 从API
    const odRes = await apiGet('/systemadmin/tool/overdue-list');
    if (odRes.success && odRes.data) {
        odRes.data.slice(0, 3).forEach(r => {
            todos.push({ title: `${r.readerName} 的图书已逾期`, detail: `${r.bookName}，逾期 ${r.overdueDays} 天`, type: "催还", link: "borrow.html" });
        });
    }

    // 2. 库存不足 — 从前端当前API数据判断
    const bookRes = await bookApi.list({ pageNum: 1, pageSize: 200 });
    if (bookRes.success && bookRes.data && bookRes.data.records) {
        bookRes.data.records.filter(b => b.available <= 0).slice(0, 2).forEach(b => {
            todos.push({ title: `${b.title} 库存不足`, detail: "可借册数为0", type: "库存", link: "books.html" });
        });
    }

    // 3. 未缴罚款
    const fineRes = await apiGet('/bookadmin/borrow/fines');
    if (fineRes.success && fineRes.data) {
        const unpaid = fineRes.data.filter(f => !f.isPaid);
        if (unpaid.length) todos.push({ title: "存在未缴罚款", detail: `共 ${unpaid.length} 条`, type: "罚款", link: "borrow.html" });
    }

    return todos;
}

// ==================== 图书管理（books.html） ====================

let bookSearchResults = null;
let currentBookPage = 1;
const BOOK_PAGE_SIZE = 8;

async function loadBooks(page = 1) {
    currentBookPage = page;
    const session = getSession();
    const isReader = session && session.role === "读者";

    // 渲染图书行
    function renderRows(items, total) {
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
                <td><div class="row-actions">
                    ${isReader ? `<button class="small-btn" onclick="readerBorrowBook(${book.id})" ${book.available > 0 ? '' : 'disabled'}>借阅</button>` : `<button class="small-btn secondary" onclick="editBook(${book.id})">编辑</button><button class="small-btn danger" onclick="deleteBook(${book.id})">删除</button>`}
                </div></td>
            </tr>`).join("") : `<tr><td colspan="9" class="empty">没有找到匹配的图书</td></tr>`;
        renderPagination("bookPagination", total, page, BOOK_PAGE_SIZE, "changeBookPage");
    }

    // 尝试后端API（带搜索条件）
    const apiRes = await bookApi.list({
        pageNum: page,
        pageSize: BOOK_PAGE_SIZE,
        bookName: currentBookSearchParams.bookName || '',
        authorName: currentBookSearchParams.authorName || '',
        isbn: currentBookSearchParams.isbn || '',
        categoryId: currentBookSearchParams.categoryId || '',
        status: currentBookSearchParams.status || ''
    });
    if (apiRes.success && apiRes.data && apiRes.data.records) {
        bookUseApi = true;
        let records = apiRes.data.records;
        // ID搜索：如果后端支持bookName模糊匹配不到数字ID，额外试一次精确查ID
        const exactId = currentBookSearchParams._exactId;
        if (exactId) {
            const byId = await bookApi.getById(exactId);
            if (byId.success && byId.data) {
                // 看看当前页是否已经有了（通常后端bookName=''所以全量返回）
                const already = records.find(r => r.id === exactId);
                if (!already) records = [byId.data];
                else records = [already];
            }
            // 如果API详情也失败，保留原列表（为空就空）
        }
        const avail = currentBookSearchParams._avail;
        if (avail === 'available') records = records.filter(b => b.available > 0);
        if (avail === 'empty') records = records.filter(b => b.available <= 0);
        renderRows(records, exactId ? records.length : apiRes.data.total);
    } else {
        // mock回退
        const source = bookSearchResults || MockData.books;
        const start = (page - 1) * BOOK_PAGE_SIZE;
        renderRows(source.slice(start, start + BOOK_PAGE_SIZE), source.length);
    }

    // 分类筛选 — 从API
    const filter = document.getElementById("categoryFilter");
    if (filter && filter.options.length <= 1) {
        const current = filter.value;
        filter.innerHTML = '<option value="">全部分类</option>';
        const catRes = await categoryApi.list();
        if (catRes.success && catRes.data) {
            catRes.data.forEach(c => {
                filter.innerHTML += `<option value="${c.categoryId}">${escapeHtml(c.categoryName)}</option>`;
            });
        }
        filter.value = current;
    }

    const addBtn = document.getElementById("addBookBtn");
    if (addBtn) addBtn.style.display = isReader ? "none" : "";
}

function changeBookPage(page) { loadBooks(page); }

function searchBooks() {
    const kw = document.getElementById("searchInput")?.value || "";
    const catId = document.getElementById("categoryFilter")?.value || "";
    const avail = document.getElementById("availabilityFilter")?.value || "";

    // 纯数字当作按ID搜索
    let _exactId = null;
    if (kw && /^\d+$/.test(kw)) _exactId = Number(kw);

    currentBookSearchParams = {
        bookName: _exactId ? '' : kw,
        authorName: '',
        isbn: '',
        categoryId: catId,
        status: '',
        _avail: avail,
        _exactId
    };

    if (bookUseApi) {
        loadBooks(1);
    } else {
        const kwLower = kw.toLowerCase();
        let list = MockData.books;
        if (_exactId) {
            const found = MockData.books.filter(b => b.id === _exactId);
            list = found.length ? found : [];
        } else if (kwLower) {
            list = list.filter(b => (b.title + b.author + b.isbn + b.category).toLowerCase().includes(kwLower));
        }
        if (catId) list = list.filter(b => String(b.category) === catId);
        if (avail === "available") list = list.filter(b => b.available > 0);
        if (avail === "empty") list = list.filter(b => b.available <= 0);
        bookSearchResults = list;
        loadBooks(1);
    }
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

async function editBook(id) {
    // 先尝试API详情
    const res = await bookApi.getById(id);
    if (res.success && res.data) {
        fillEditForm(res.data);
        return;
    }
    // mock回退
    const book = MockData.getBook(id);
    if (book) fillEditForm(book);
}

function fillEditForm(book) {
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

    // 调后端API
    const res = id ? await bookApi.update(book) : await bookApi.add(book);
    if (res.success) {
        closeBookModal();
        loadBooks(1);
        showToast(id ? "图书已更新（数据库）" : "图书已添加（数据库）");
    } else {
        showToast("操作失败：" + res.message);
    }
}

async function deleteBook(id) {
    if (!await showConfirm("确认删除该书吗？")) return;
    const res = await bookApi.delete(id);
    if (res.success) {
        loadBooks(1);
        showToast("图书已删除（数据库）");
    } else {
        showToast("删除失败：" + res.message);
    }
}

function readerBorrowBook(bookId) {
    const session = getSession();
    if (!session || !session.readerId) {
        // 读者登录后 session 里存了 readerId
        showToast("请用读者账号登录后借阅"); return;
    }
    borrowBookDirect(session.readerId, bookId);
}

// ==================== 借阅管理（borrow.html） ====================

async function borrowBookDirect(readerId, bookId) {
    // 直接调后端API，后端会做所有校验
    const res = await borrowApi.lend(readerId, bookId);
    if (res.success) {
        showToast("借阅成功！");
    } else {
        showToast("借阅失败：" + res.message);
    }
    refreshBorrowPage();
}

async function quickBorrow() {
    const readerId = Number(document.getElementById("borrowReaderId").value);
    const bookId = Number(document.getElementById("borrowBookId").value);
    if (!readerId || !bookId) { showToast("请输入读者ID和图书编号"); return; }
    await borrowBookDirect(readerId, bookId);
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

let borrowIdSearchFilter = "";

async function searchBorrowRecords() {
    borrowIdSearchFilter = document.getElementById("borrowIdSearch")?.value.trim() || "";
    loadBorrowRecords(document.getElementById("recordStatusFilter")?.value || "");
}

async function loadBorrowRecords(filterStatus = "") {
    const session = getSession();
    const tbody = document.getElementById("borrowListBody");
    if (!tbody) return;

    let records = [];
    const isReader = session.role === "读者";
    if (isReader) {
        const rid = session.readerId;
        if (rid) {
            const res = await apiGet('/bookadmin/borrow/list/' + rid);
            if (res.success && res.data) records = res.data;
        }
    } else {
        const res = await apiGet('/bookadmin/borrow/list');
        if (res.success && res.data) records = res.data;
    }

    if (filterStatus) records = records.filter(r => r.borrowStatus === filterStatus);

    // 按借阅ID或读者ID筛选
    if (borrowIdSearchFilter) {
        records = records.filter(r =>
            String(r.borrowId) === borrowIdSearchFilter ||
            String(r.readerId) === borrowIdSearchFilter
        );
    }

    tbody.innerHTML = records.length ? records.map(r => {
        const canRenew = r.borrowStatus !== "已归还" && !r.isRenewed && r.renewedTimes < 1;
        const canReturn = r.borrowStatus !== "已归还";
        const sc = r.borrowStatus === "已归还" ? "ok" : r.borrowStatus === "逾期" ? "bad" : "warn";
        return `<tr>
            <td>${r.borrowId}</td>
            <td><small>读者ID:${r.readerId}</small></td>
            <td><small>书ID:${r.bookId}</small></td>
            <td>${r.borrowDate}</td><td>${r.dueDate}</td>
            <td><span class="status ${sc}">${r.borrowStatus}</span></td>
            <td>${r.renewedTimes || 0}/1</td>
            <td><div class="row-actions">
                <button class="small-btn secondary" onclick="renewBook(${r.borrowId})" ${canRenew?'':'disabled'}>续借</button>
                <button class="small-btn warning" onclick="returnBook(${r.borrowId})" ${canReturn?'':'disabled'}>归还</button>
            </div></td></tr>`;
    }).join("") : `<tr><td colspan="8" class="empty">暂无借阅记录</td></tr>`;

    // 罚款 + 规则也从后端取
    const fineRes = await apiGet('/bookadmin/borrow/fines');
    renderFinesFromAPI(session, fineRes.success ? fineRes.data : []);

    const ruleRes = await apiGet('/systemadmin/borrow/rules');
    renderRuleSummaryFromAPI(session, ruleRes.success ? ruleRes.data : []);
}

function renderFinesFromAPI(session, fines) {
    const tbody = document.getElementById("fineTableBody");
    if (!tbody) return;
    if (session.role === "读者") {
        const rid = session.readerId;
        if (rid) fines = fines.filter(f => f.readerId === rid);
    }
    tbody.innerHTML = fines.length ? fines.map(f => `<tr>
        <td>${f.fineId}</td><td>${f.borrowId}</td><td>${parseFloat(f.fineAmount||0).toFixed(2)}元</td>
        <td>${f.createDate||'-'}</td><td><span class="status ${f.isPaid?'ok':'bad'}">${f.isPaid?'已缴纳':'未缴纳'}</span></td>
        <td><button class="small-btn" onclick="payFine(${f.fineId})" ${f.isPaid?'disabled':''}>缴纳</button></td></tr>`).join("")
        : `<tr><td colspan="6" class="empty">暂无罚款记录</td></tr>`;
}

function renderRuleSummaryFromAPI(session, rules) {
    const el = document.getElementById("ruleSummary");
    if (!el || session.role==="读者") { if(el)el.innerHTML=""; return; }
    const r = rules[0];
    if (!r) { el.innerHTML = ""; return; }
    el.innerHTML = `<div><strong>${r.maxBorrowDays}天</strong><span>最大借阅天数</span></div>
        <div><strong>${r.maxBorrowCount}本</strong><span>最大借阅数量</span></div>
        <div><strong>${parseFloat(r.finePerDay||0).toFixed(2)}元/天</strong><span>每日逾期费</span></div>
        <div><strong>${r.maxRenewTimes||0}次</strong><span>续借次数</span></div>
        <div><strong>${r.renewDays||0}天</strong><span>续借天数</span></div>
        <div><span>${r.readerType||''}规则</span></div>`;
}

function payFine(fineId) {
    // 简单标记
    showToast("请在数据库中标记缴纳");
}

function refreshBorrowPage() {
    borrowIdSearchFilter = "";
    const filter = document.getElementById("recordStatusFilter")?.value || "";
    loadBorrowRecords(filter);
}

// ==================== 读者管理（readers.html） ✅ 已连数据库 ====================

let readerSearchResults = null;
let currentReaderPage = 1;
const READER_PAGE_SIZE = 8;

async function loadReaders(page = 1) {
    currentReaderPage = page;
    const tbody = document.getElementById("readerListBody");
    if (!tbody) return;

    const res = await readerApi.list(document.getElementById("readerSearch")?.value || "");
    let list = [];
    if (res.success && res.data) {
        list = res.data.map(r => ({ id: r.readerId, name: r.readerName, gender: r.gender, phone: r.phone, type: r.readerType, status: r.status }));
        readerSearchResults = list;
    } else {
        list = (readerSearchResults || MockData.readers);
    }

    const start = (page - 1) * READER_PAGE_SIZE;
    const items = list.slice(start, start + READER_PAGE_SIZE);
    tbody.innerHTML = items.length ? items.map(r => `
        <tr>
            <td>${r.id}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.gender)}</td>
            <td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.type)}</td>
            <td><span class="status ${r.status==='正常'?'ok':'bad'}">${escapeHtml(r.status)}</span></td>
            <td><div class="row-actions"><button class="small-btn secondary" onclick="editReader(${r.id})">编辑</button><button class="small-btn danger" onclick="deleteReader(${r.id})">删除</button></div></td>
        </tr>`).join("") : `<tr><td colspan="7" class="empty">暂无读者数据</td></tr>`;
    renderPagination("readerPagination", list.length, page, READER_PAGE_SIZE, "changeReaderPage");
}

function changeReaderPage(page) { loadReaders(page); }

async function searchReaders() {
    const kw = document.getElementById("readerSearch")?.value.trim() || "";
    readerSearchResults = null;
    // 纯数字 → 按ID搜索
    if (kw && /^\d+$/.test(kw)) {
        const res = await readerApi.list("");
        const list = (res.success && res.data) ? res.data.map(r => ({ id: r.readerId, name: r.readerName, gender: r.gender, phone: r.phone, type: r.readerType, status: r.status })) : [];
        readerSearchResults = list.filter(r => String(r.id) === kw);
    }
    loadReaders(1);
}

function openReaderModal() {
    document.getElementById("readerModalTitle").textContent = "添加读者";
    document.getElementById("editReaderId").value = "";
    ["readerName","readerGender","readerPhone","readerType","readerStatus"].forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        if (id === "readerGender") el.value = "男"; else if (id === "readerType") el.value = "本科生"; else if (id === "readerStatus") el.value = "正常"; else el.value = "";
    });
    document.getElementById("readerModal").style.display = "flex";
}

function closeReaderModal() { document.getElementById("readerModal").style.display = "none"; }

async function editReader(id) {
    const res = await apiGet('/bookadmin/reader/list?keyword=');
    const list = (res.success && res.data) ? res.data : [];
    const r = list.find(x => x.readerId == id);
    if (r) {
        document.getElementById("readerModalTitle").textContent = "编辑读者";
        document.getElementById("editReaderId").value = r.readerId;
        document.getElementById("readerName").value = r.readerName || '';
        document.getElementById("readerPhone").value = r.phone || '';
        document.getElementById("readerGender").value = r.gender || '男';
        document.getElementById("readerType").value = r.readerType || '本科生';
        document.getElementById("readerStatus").value = r.status || '正常';
        document.getElementById("readerModal").style.display = "flex";
        return;
    }
    // fallback mock
    const mr = MockData.getReader(id); if (!mr) return;
    document.getElementById("readerModalTitle").textContent = "编辑读者";
    document.getElementById("editReaderId").value = mr.id;
    document.getElementById("readerName").value = mr.name;
    document.getElementById("readerGender").value = mr.gender||"男"; document.getElementById("readerPhone").value = mr.phone;
    document.getElementById("readerType").value = mr.type||"本科生"; document.getElementById("readerStatus").value = mr.status||"正常";
    document.getElementById("readerModal").style.display = "flex";
}

async function saveReader() {
    const id = Number(document.getElementById("editReaderId").value) || 0;
    const name = document.getElementById("readerName").value.trim();
    if (!name) { showToast("姓名不能为空"); return; }
    const reader = {
        id, name,
        gender: document.getElementById("readerGender")?.value || "男",
        phone: document.getElementById("readerPhone")?.value.trim() || "",
        type: document.getElementById("readerType")?.value || "本科生",
        status: document.getElementById("readerStatus")?.value || "正常"
    };
    const res = id ? await readerApi.update(reader) : await readerApi.add(reader);
    if (res.success) { closeReaderModal(); readerSearchResults = null; loadReaders(1); showToast(id ? "读者已更新（数据库）。" : "读者已添加（数据库）。"); }
    else { showToast("操作失败：" + res.message); }
}

async function deleteReader(id) {
    if (!await showConfirm("确认删除该读者吗？")) return;
    const res = await readerApi.delete(id);
    if (res.success) { readerSearchResults = null; loadReaders(1); showToast("读者已删除（数据库）。"); }
    else showToast("删除失败：" + res.message);
}

// ==================== 统计报表（report.html） ====================

async function loadReports() {
    // 热门图书柱状图
    const hotRes = await reportApi.hotBooks();
    const hotBody = document.getElementById("hotBookBars");
    if (hotBody && hotRes.success && hotRes.data) {
        const max = Math.max(...hotRes.data.map(b => b.cnt || 1), 1);
        hotBody.innerHTML = hotRes.data.map(b => {
            const w = Math.round((b.cnt || 1) / max * 100);
            return `<div class="bar-row"><strong>${escapeHtml(b.name)}</strong><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span>${b.cnt || 0}</span></div>`;
        }).join("");
    }

    // 活跃读者柱状图
    const arRes = await reportApi.activeReaders();
    const acBody = document.getElementById("activeReaderBars");
    if (acBody && arRes.success && arRes.data) {
        const max = Math.max(...arRes.data.map(a => a.cnt || 1), 1);
        acBody.innerHTML = arRes.data.map(a => {
            const w = Math.round((a.cnt || 1) / max * 100);
            return `<div class="bar-row"><strong>${escapeHtml(a.name)}</strong><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span>${a.cnt || 0}</span></div>`;
        }).join("");
    }

    // 逾期催还名单
    const odRes = await reportApi.overdueList();
    const odBody = document.getElementById("overdueTableBody");
    if (odBody && odRes.success && odRes.data) {
        odBody.innerHTML = odRes.data.length ? odRes.data.map(r => `
            <tr><td>${escapeHtml(r.readerName)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.bookName)}</td><td>${r.dueDate}</td><td>${r.overdueDays}</td><td>${parseFloat(r.fine||0).toFixed(2)} 元</td></tr>`).join("") : `<tr><td colspan="6" class="empty">暂无逾期记录</td></tr>`;
    }

    const todayEl = document.getElementById("todayText");
    if (todayEl) todayEl.textContent = '今天：' + todayStr();
}

// ==================== 系统安全（admin.html） ====================

async function loadAdminData() {
    // 用户权限（从User表）
    const usersRes = await adminApi.listUsers();
    const roleBody = document.getElementById("roleListBody");
    if (roleBody && usersRes.success && usersRes.data) {
        roleBody.innerHTML = usersRes.data.map((u, i) => {
            const isInactive = u.isActive !== null && u.isActive === false;
            return `<tr style="${isInactive?'color:#999;background:#f9f9f9':''}"><td>${i+1}</td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.role)}</td><td><span class="status ${isInactive?'bad':'ok'}">${isInactive?'已注销':'正常'}</span></td>
            <td><div class="row-actions"><button class="small-btn secondary" onclick="editRole('${escapeHtml(u.username)}','${escapeHtml(u.role)}',${u.userId})">编辑</button>
            ${isInactive ? `<button class="small-btn" onclick="activateRole(${u.userId})">恢复</button>` : `<button class="small-btn danger" onclick="deleteRole(${u.userId})">注销</button>`}
            </div></td></tr>`;
        }).join("");
    }

    // 分类
    const catRes = await categoryApi.list();
    const chipList = document.getElementById("categoryChipList");
    if (chipList && catRes.success && catRes.data) {
        chipList.innerHTML = catRes.data.map(c => `<span class="chip">${escapeHtml(c.categoryName)}<button onclick="deleteCategory(${c.categoryId})">×</button></span>`).join("");
    }

    // 规则
    loadRuleForType();
    renderInviteCodeList();
}

function openRoleModal(username, role, userId) {
    document.getElementById("roleModalTitle").textContent = username ? "编辑用户权限" : "新增用户权限";
    document.getElementById("editRoleUsername").value = username || "";
    document.getElementById("editRoleUserId").value = userId || "";
    document.getElementById("roleUsername").value = username || "";
    document.getElementById("roleType").value = role || "图书管理员";
    if (!username) document.getElementById("rolePassword").value = "123456";
    document.getElementById("roleModal").style.display = "flex";
}

function closeRoleModal() { document.getElementById("roleModal").style.display = "none"; }

async function saveRole() {
    const userId = document.getElementById("editRoleUserId").value;
    const username = document.getElementById("roleUsername").value.trim();
    const role = document.getElementById("roleType").value;
    if (!username) { showToast("用户名不能为空"); return; }
    const res = userId ? await adminApi.updateUser({ userId: parseInt(userId), username, role }) : await adminApi.addUser({ username, password: document.getElementById("rolePassword")?.value || "123456", role, isActive: true });
    if (res.success) { closeRoleModal(); loadAdminData(); showToast(userId ? "已更新。" : "已添加。"); }
    else showToast("操作失败：" + res.message);
}

async function deleteRole(userId) {
    if (!await showConfirm("确认注销该用户？（可恢复）")) return;
    const res = await authApi.deactivate(userId);
    if (res.success) { loadAdminData(); showToast("用户已注销。"); }
    else showToast("注销失败：" + res.message);
}

async function activateRole(userId) {
    const res = await authApi.activate(userId);
    if (res.success) { loadAdminData(); showToast("用户已重新激活。"); }
    else showToast("操作失败：" + res.message);
}

async function deleteCategory(id) {
    if (!await showConfirm("确认删除该分类？")) return;
    const res = await categoryApi.delete(id);
    if (res.success) { loadAdminData(); showToast("分类已删除。"); }
    else showToast("删除失败：" + res.message);
}

async function addCategory() {
    const name = document.getElementById("newCategory")?.value.trim();
    if (!name) { showToast("请输入分类名称"); return; }
    const res = await categoryApi.add(name);
    if (res.success) { document.getElementById("newCategory").value = ""; loadAdminData(); showToast("分类已添加。"); }
    else showToast("添加失败：" + res.message);
}

async function loadRuleForType() {
    const t = document.getElementById("ruleReaderType")?.value || "本科生";
    const res = await ruleApi.getByType(t);
    if (res.success && res.data) {
        const r = res.data;
        const fields = { maxBorrow: r.maxBorrowCount, borrowDays: r.maxBorrowDays, overdueFee: r.finePerDay, maxRenewTimes: r.maxRenewTimes, renewDays: r.renewDays };
        Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    }
}

async function saveBorrowRules() {
    const maxBorrowCount = Number(document.getElementById("maxBorrow")?.value) || 5;
    const maxBorrowDays = Number(document.getElementById("borrowDays")?.value) || 30;
    const finePerDay = Number(document.getElementById("overdueFee")?.value) || 0.5;
    const maxRenewTimes = Number(document.getElementById("maxRenewTimes")?.value) || 1;
    const renewDays = Number(document.getElementById("renewDays")?.value) || 15;
    const readerType = document.getElementById("ruleReaderType")?.value || "本科生";
    const res = await ruleApi.save({ readerType, maxBorrowCount, maxBorrowDays, finePerDay, maxRenewTimes, renewDays });
    showToast(res.success ? "规则已保存（数据库）。" : "保存失败：" + res.message);
}

async function editRole(username) {
    const res = await adminApi.listUsers();
    if (res.success && res.data) {
        const u = res.data.find(x => x.username === username);
        if (u) openRoleModal(u.username, u.role, u.userId);
    }
}

function backupData() {
    const data = {
        books: MockData.books, readers: MockData.readers,
        borrowRecords: MockData.borrowRecords, fines: MockData.fines,
        rules: MockData.rules, categories: MockData.categories,
        users: MockData.users, inviteCodes: MockData.inviteCodes
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
        if (data.inviteCodes) MockData.inviteCodes = data.inviteCodes;
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
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.onRegRoleChange = onRegRoleChange;
window.register = register;
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
window.searchBorrowRecords = searchBorrowRecords;
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
window.activateRole = activateRole;
window.deleteCategory = deleteCategory;
window.addCategory = addCategory;
window.saveBorrowRules = saveBorrowRules;
window.backupData = backupData;
window.restoreDemoData = restoreDemoData;
window.generateInviteCode = generateInviteCode;
window.revokeInviteCode = revokeInviteCode;
