// ======================= 全局模拟数据 (后面替换成后端API) =======================
// 图书数据
let books = [
    { id: 1, title: "数据库原理", author: "王珊", isbn: "9787111123456", publisher: "清华大学出版社", category: "计算机" },
    { id: 2, title: "深入理解计算机系统", author: "Randal E. Bryant", isbn: "9787111543456", publisher: "机械工业出版社", category: "计算机" },
    { id: 3, title: "三体", author: "刘慈欣", isbn: "9787229030933", publisher: "重庆出版社", category: "科幻" }
];
let nextBookId = 4;

// 借阅记录数据
let borrowRecords = [
    { id: 1, readerName: "张三", bookTitle: "数据库原理", borrowDate: "2025-05-20", dueDate: "2025-06-03", status: "借出中" },
    { id: 2, readerName: "李四", bookTitle: "三体", borrowDate: "2025-05-01", dueDate: "2025-05-15", status: "超期" }
];
let nextBorrowId = 3;

// 读者数据
let readers = [
    { id: 1, cardId: "R001", name: "张三", phone: "13800138001", email: "zhang@example.com" },
    { id: 2, cardId: "R002", name: "李四", phone: "13800138002", email: "li@example.com" }
];
let nextReaderId = 3;

// 系统管理员数据
let roles = [
    { id: 1, username: "admin", role: "系统管理员" },
    { id: 2, username: "manager01", role: "图书管理员" },
    { id: 3, username: "reader01", role: "读者" }
];
let nextRoleId = 4;
let users = [
    { username: "admin", password: "123456", role: "系统管理员" },
    { username: "manager01", password: "123456", role: "图书管理员" },
    { username: "reader01", password: "123456", role: "读者" }
];
loadStoredUsers();

function loadStoredUsers() {
    const raw = localStorage.getItem("libraryUsers");
    if (!raw) return;
    try {
        const storedUsers = JSON.parse(raw);
        if (Array.isArray(storedUsers) && storedUsers.length) {
            users = storedUsers;
        }
    } catch (e) {
        console.warn("无法加载存储的用户数据：", e);
    }
}

function saveStoredUsers() {
    localStorage.setItem("libraryUsers", JSON.stringify(users));
}
let categories = ["计算机", "科幻", "文学", "管理"];
let borrowRules = {
    maxBorrow: 5,
    borrowDays: 30,
    overdueFee: 0.5
};

let currentBookPage = 1;
const bookPageSize = 5;
let bookSearchResults = null;
let currentReaderPage = 1;
const readerPageSize = 5;
let readerSearchResults = null;

// 热门图书统计 (借阅次数)
let hotBooksStat = [
    { bookTitle: "数据库原理", borrowCount: 5 },
    { bookTitle: "三体", borrowCount: 3 },
    { bookTitle: "深入理解计算机系统", borrowCount: 2 }
];

let activeReadersStat = [
    { name: "张三", borrowCount: 4 },
    { name: "李四", borrowCount: 2 }
];

// ======================= 通用辅助函数 =======================
function renderTable(tbodyId, rowsHtml) {
    document.getElementById(tbodyId).innerHTML = rowsHtml;
}

function getSession() {
    const raw = localStorage.getItem("librarySession");
    return raw ? JSON.parse(raw) : null;
}

function setSession(user) {
    localStorage.setItem("librarySession", JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem("librarySession");
}

function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;
    if (!username || !password) {
        showToast("用户名和密码不能为空。");
        return;
    }
    const user = users.find(u => u.username === username && u.password === password && u.role === role);
    if (!user) {
        showToast("登录失败，请检查用户名、密码和角色是否匹配。");
        return;
    }
    setSession(user);
    window.location.href = "index.html";
}

function logout() {
    clearSession();
    window.location.href = "login.html";
}

function goToLogin() {
    window.location.href = "login.html";
}

function refreshTopbar() {
    const session = getSession();
    const footerInfo = document.getElementById("footerUserInfo");
    const footer = document.getElementById("footerLogout");
    if (footerInfo) {
        footerInfo.innerText = session ? `当前用户：${escapeHtml(session.username)}（${escapeHtml(session.role)}）` : "";
    }
    if (footer) {
        footer.style.display = session ? "flex" : "none";
    }
    updateUserPanels(session);
}

function updateUserPanels(session) {
    const avatarEls = document.querySelectorAll("#sidebarAvatar");
    const nameEls = document.querySelectorAll("#sidebarUserName");
    const roleEls = document.querySelectorAll("#sidebarUserRole");
    const infoEl = document.getElementById("currentUserInfo");
    avatarEls.forEach(el => {
        if (!session) {
            el.style.backgroundImage = "";
            el.innerText = "?";
            return;
        }
        const initials = session.username ? session.username[0].toUpperCase() : "?";
        if (session.avatar) {
            el.style.backgroundImage = `url('${session.avatar}')`;
            el.style.backgroundSize = "cover";
            el.style.color = "transparent";
            el.innerText = "";
        } else {
            el.style.backgroundImage = "";
            el.style.color = "#fff";
            el.innerText = initials;
        }
    });
    nameEls.forEach(el => {
        el.innerText = session ? session.username : "当前用户";
    });
    roleEls.forEach(el => {
        el.innerText = session ? session.role : "未登录";
    });
    if (infoEl) {
        infoEl.innerHTML = session ? `当前用户：<strong>${escapeHtml(session.username)}</strong>，角色：<strong>${escapeHtml(session.role)}</strong>` : "您尚未登录，请点击“登录系统”。";
    }
}

let pendingAvatarData = null;

function openProfileModal() {
    const session = getSession();
    if (!session) {
        showToast("请先登录后再编辑个人信息。");
        return;
    }
    document.getElementById("profileOldUsername").value = session.username;
    document.getElementById("profileUsername").value = session.username;
    document.getElementById("profilePassword").value = "";
    pendingAvatarData = null;
    const preview = document.getElementById("profileAvatarPreview");
    if (preview) {
        preview.style.backgroundImage = session.avatar ? `url('${session.avatar}')` : "";
        preview.innerText = session.avatar ? "" : (session.username ? session.username[0].toUpperCase() : "?");
    }
    document.getElementById("profileModal").style.display = "flex";
}

function closeProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.style.display = "none";
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
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
    if (!session) {
        showToast("会话已过期，请重新登录。");
        window.location.href = "login.html";
        return;
    }
    const oldUsername = document.getElementById("profileOldUsername").value.trim();
    const newUsername = document.getElementById("profileUsername").value.trim();
    const newPassword = document.getElementById("profilePassword").value;
    if (!newUsername) {
        showToast("用户名不能为空。");
        return;
    }
    const userIndex = users.findIndex(u => u.username === oldUsername && u.role === session.role);
    if (userIndex !== -1) {
        users[userIndex].username = newUsername;
        if (newPassword) {
            users[userIndex].password = newPassword;
        }
        if (pendingAvatarData) {
            users[userIndex].avatar = pendingAvatarData;
        }
    }
    session.username = newUsername;
    if (newPassword) {
        session.password = newPassword;
    }
    if (pendingAvatarData) {
        session.avatar = pendingAvatarData;
    }
    saveStoredUsers();
    setSession(session);
    updateUserPanels(session);
    refreshTopbar();
    closeProfileModal();
    showToast("个人信息已保存。");
}

function loadWelcome() {
    const session = getSession();
    const info = document.getElementById("currentUserInfo");
    const subtitle = document.getElementById("welcomeSubtitle");
    const adminCard = document.getElementById("adminCard");
    if (!session) {
        if (info) info.innerText = "您尚未登录，请点击“登录系统”。";
        if (subtitle) subtitle.innerText = "请先登录以进入管理员界面和管理功能。";
        if (adminCard) adminCard.style.display = "none";
        refreshTopbar();
        return;
    }
    if (info) info.innerHTML = `当前用户：<strong>${escapeHtml(session.username)}</strong>，角色：<strong>${escapeHtml(session.role)}</strong>`;
    refreshTopbar();
    if (subtitle) subtitle.innerText = `您已以“${session.role}”身份登录，欢迎使用系统。`;
    if (adminCard) {
        adminCard.style.display = session.role === "系统管理员" ? "block" : "none";
    }
}

// ======================= 图书管理 (books.html) =======================
function renderPagination(containerId, totalItems, currentPage, pageSize, changeFunc) {
    let pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
    if (!document.getElementById(containerId)) return;
    if (pageCount <= 1) {
        document.getElementById(containerId).innerHTML = "";
        return;
    }
    let html = `<button onclick="${changeFunc}(1)" ${currentPage === 1 ? "disabled" : ""}>«</button>`;
    for (let i = 1; i <= pageCount; i++) {
        html += `<button class="${currentPage === i ? "active" : ""}" onclick="${changeFunc}(${i})">${i}</button>`;
    }
    html += `<button onclick="${changeFunc}(${pageCount})" ${currentPage === pageCount ? "disabled" : ""}>»</button>`;
    document.getElementById(containerId).innerHTML = html;
}

function renderBookList(page = 1) {
    currentBookPage = page;
    let source = bookSearchResults || books;
    let start = (page - 1) * bookPageSize;
    let pageItems = source.slice(start, start + bookPageSize);
    let html = "";
    pageItems.forEach(book => {
        html += `<tr>
            <td>${book.id}</td>
            <td>${escapeHtml(book.title)}</td>
            <td>${escapeHtml(book.author)}</td>
            <td>${book.isbn}</td>
            <td>${escapeHtml(book.publisher)}</td>
            <td>${escapeHtml(book.category)}</td>
            <td>
                <button id="editBookBtn-${book.id}" onclick="editBook(${book.id})">编辑</button>
                <button id="deleteBookBtn-${book.id}" class="danger" onclick="deleteBook(${book.id})">删除</button>
            </td>
        </tr>`;
    });
    renderTable("bookListBody", html);
    renderPagination("bookPagination", source.length, page, bookPageSize, "changeBookPage");
}

function changeBookPage(page) {
    renderBookList(page);
}

function loadBooks() {
    bookSearchResults = null;
    renderBookList(1);
}

function searchBooks() {
    let keyword = document.getElementById("searchInput").value.toLowerCase();
    bookSearchResults = books.filter(b => b.title.toLowerCase().includes(keyword) || b.author.toLowerCase().includes(keyword) || b.category.toLowerCase().includes(keyword));
    renderBookList(1);
}

function openAddModal() {
    document.getElementById("modalTitle").innerText = "添加图书";
    document.getElementById("editBookId").value = "";
    document.getElementById("bookTitle").value = "";
    document.getElementById("bookAuthor").value = "";
    document.getElementById("bookIsbn").value = "";
    document.getElementById("bookPublisher").value = "";
    document.getElementById("bookCategory").value = "";
    document.getElementById("bookModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("bookModal").style.display = "none";
}

function saveBook() {
    let id = document.getElementById("editBookId").value;
    let title = document.getElementById("bookTitle").value.trim();
    let author = document.getElementById("bookAuthor").value.trim();
    let isbn = document.getElementById("bookIsbn").value.trim();
    let publisher = document.getElementById("bookPublisher").value.trim();
    let category = document.getElementById("bookCategory").value.trim();
    if(!title || !author) { showToast("书名和作者不能为空"); return; }
    if(id) { // 编辑
        let idx = books.findIndex(b => b.id == id);
        if(idx !== -1) {
            books[idx] = { ...books[idx], title, author, isbn, publisher, category };
        }
    } else { // 新增
        books.push({ id: nextBookId++, title, author, isbn, publisher, category });
    }
    closeModal();
    bookSearchResults = null;
    loadBooks();
}

function editBook(id) {
    let book = books.find(b => b.id == id);
    if(book) {
        document.getElementById("modalTitle").innerText = "编辑图书";
        document.getElementById("editBookId").value = book.id;
        document.getElementById("bookTitle").value = book.title;
        document.getElementById("bookAuthor").value = book.author;
        document.getElementById("bookIsbn").value = book.isbn;
        document.getElementById("bookPublisher").value = book.publisher;
        document.getElementById("bookCategory").value = book.category;
        document.getElementById("bookModal").style.display = "flex";
    }
}

async function deleteBook(id) {
    if (await showConfirm("确认删除这本书吗？")) {
        books = books.filter(b => b.id !== id);
        bookSearchResults = null;
        loadBooks();
    }
}

// ======================= 借阅管理 (borrow.html) =======================
function loadBorrowRecords() {
    let tbody = document.getElementById("borrowListBody");
    if(!tbody) return;
    let html = "";
    borrowRecords.forEach(rec => {
        let statusClass = rec.status === "超期" ? "danger" : "";
        html += `<tr>
            <td>${rec.id}</td><td>${escapeHtml(rec.readerName)}</td><td>${escapeHtml(rec.bookTitle)}</td>
            <td>${rec.borrowDate}</td><td>${rec.dueDate}</td>
            <td class="${statusClass}">${rec.status}</td>
            <td><button id="returnBookBtn-${rec.id}" onclick="returnBook(${rec.id})">归还</button></td>
        </tr>`;
    });
    renderTable("borrowListBody", html);
}

function searchBorrowRecords() {
    let keyword = document.getElementById("borrowSearch").value.toLowerCase();
    let filtered = borrowRecords.filter(r => r.readerName.toLowerCase().includes(keyword) || r.bookTitle.toLowerCase().includes(keyword));
    let html = "";
    filtered.forEach(rec => {
        html += `<tr><td>${rec.id}</td><td>${escapeHtml(rec.readerName)}</td><td>${escapeHtml(rec.bookTitle)}</td>
        <td>${rec.borrowDate}</td><td>${rec.dueDate}</td><td>${rec.status}</td>
        <td><button id="returnBookBtn-${rec.id}" onclick="returnBook(${rec.id})">归还</button></td></tr>`;
    });
    renderTable("borrowListBody", html);
}

async function returnBook(recordId) {
    if (await showConfirm("确认归还？系统将自动计算超期罚款（演示）")) {
        let record = borrowRecords.find(r => r.id === recordId);
        if(record) {
            // 实际应调用后端计算逾期费用，这里演示移除记录
            borrowRecords = borrowRecords.filter(r => r.id !== recordId);
            loadBorrowRecords();
            showToast(`已归还《${record.bookTitle}》`);
        }
    }
}

// ======================= 读者管理 (readers.html) =======================
function renderReaderList(page = 1) {
    currentReaderPage = page;
    let source = readerSearchResults || readers;
    let start = (page - 1) * readerPageSize;
    let pageItems = source.slice(start, start + readerPageSize);
    let html = "";
    pageItems.forEach(r => {
        html += `<tr>
            <td>${r.id}</td><td>${r.cardId}</td><td>${escapeHtml(r.name)}</td>
            <td>${r.phone}</td><td>${r.email}</td>
            <td><button id="editReaderBtn-${r.id}" onclick="editReader(${r.id})">编辑</button><button id="deleteReaderBtn-${r.id}" class="danger" onclick="deleteReader(${r.id})">删除</button></td>
        </tr>`;
    });
    renderTable("readerListBody", html);
    renderPagination("readerPagination", source.length, page, readerPageSize, "changeReaderPage");
}

function changeReaderPage(page) {
    renderReaderList(page);
}

function loadReaders() {
    readerSearchResults = null;
    renderReaderList(1);
}

function searchReaders() {
    let kw = document.getElementById("readerSearch").value.toLowerCase();
    readerSearchResults = readers.filter(r => r.name.toLowerCase().includes(kw) || r.cardId.toLowerCase().includes(kw));
    renderReaderList(1);
}

function openReaderModal() {
    document.getElementById("readerModalTitle").innerText = "添加读者";
    document.getElementById("editReaderId").value = "";
    document.getElementById("readerCardId").value = "";
    document.getElementById("readerName").value = "";
    document.getElementById("readerPhone").value = "";
    document.getElementById("readerEmail").value = "";
    document.getElementById("readerModal").style.display = "flex";
}

function closeReaderModal() {
    document.getElementById("readerModal").style.display = "none";
}

function saveReader() {
    let id = document.getElementById("editReaderId").value;
    let cardId = document.getElementById("readerCardId").value.trim();
    let name = document.getElementById("readerName").value.trim();
    let phone = document.getElementById("readerPhone").value.trim();
    let email = document.getElementById("readerEmail").value.trim();
    if(!cardId || !name) { showToast("借书证号和姓名不能为空"); return; }
    if(id) {
        let idx = readers.findIndex(r => r.id == id);
        if(idx !== -1) readers[idx] = { ...readers[idx], cardId, name, phone, email };
    } else {
        readers.push({ id: nextReaderId++, cardId, name, phone, email });
    }
    closeReaderModal();
    loadReaders();
}

function editReader(id) {
    let r = readers.find(r => r.id == id);
    if(r) {
        document.getElementById("readerModalTitle").innerText = "编辑读者";
        document.getElementById("editReaderId").value = r.id;
        document.getElementById("readerCardId").value = r.cardId;
        document.getElementById("readerName").value = r.name;
        document.getElementById("readerPhone").value = r.phone;
        document.getElementById("readerEmail").value = r.email;
        document.getElementById("readerModal").style.display = "flex";
    }
}

async function deleteReader(id) {
    if (await showConfirm("删除读者会同时删除其借阅记录吗？演示中仅删除读者")) {
        readers = readers.filter(r => r.id !== id);
        readerSearchResults = null;
        loadReaders();
    }
}

// ======================= 系统安全 (admin.html) =======================
function loadAdminData() {
    const roleBody = document.getElementById("roleListBody");
    if (roleBody) {
        let html = "";
        roles.forEach(r => {
            html += `<tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.username)}</td>
                <td>${escapeHtml(r.role)}</td>
                <td><button id="editRoleBtn-${r.id}" onclick="editRole(${r.id})">编辑</button><button id="deleteRoleBtn-${r.id}" class="danger" onclick="deleteRole(${r.id})">删除</button></td>
            </tr>`;
        });
        renderTable("roleListBody", html);
    }

    const categoryBody = document.getElementById("categoryListBody");
    if (categoryBody) {
        let html = "";
        categories.forEach((category, index) => {
            html += `<tr><td>${index + 1}</td><td>${escapeHtml(category)}</td><td><button id="editCategoryBtn-${index}" onclick="editCategory(${index})">编辑</button><button id="deleteCategoryBtn-${index}" class="danger" onclick="deleteCategory(${index})">删除</button></td></tr>`;
        });
        renderTable("categoryListBody", html);
    }

    const maxBorrowInput = document.getElementById("maxBorrow");
    const borrowDaysInput = document.getElementById("borrowDays");
    const overdueFeeInput = document.getElementById("overdueFee");
    if (maxBorrowInput && borrowDaysInput && overdueFeeInput) {
        maxBorrowInput.value = borrowRules.maxBorrow;
        borrowDaysInput.value = borrowRules.borrowDays;
        overdueFeeInput.value = borrowRules.overdueFee;
    }
}

function openRoleModal(roleId) {
    const modal = document.getElementById("roleModal");
    const title = document.getElementById("roleModalTitle");
    const editRoleId = document.getElementById("editRoleId");
    const roleUsername = document.getElementById("roleUsername");
    const roleType = document.getElementById("roleType");
    if (roleId != null) {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            title.innerText = "编辑用户权限";
            editRoleId.value = role.id;
            roleUsername.value = role.username;
            roleType.value = role.role;
        }
    } else {
        title.innerText = "新增用户权限";
        editRoleId.value = "";
        roleUsername.value = "";
        roleType.value = "图书管理员";
    }
    modal.style.display = "flex";
}

function closeRoleModal() {
    document.getElementById("roleModal").style.display = "none";
}

function saveRole() {
    let id = document.getElementById("editRoleId").value;
    let username = document.getElementById("roleUsername").value.trim();
    let role = document.getElementById("roleType").value;
    if (!username) { showToast("用户名不能为空"); return; }
    if (id) {
        const idx = roles.findIndex(r => r.id == id);
        if (idx !== -1) {
            roles[idx] = { id: roles[idx].id, username, role };
        }
    } else {
        roles.push({ id: nextRoleId++, username, role });
    }
    closeRoleModal();
    loadAdminData();
}

function editRole(id) {
    openRoleModal(id);
}

async function deleteRole(id) {
    if (await showConfirm("确认删除该用户权限记录吗？")) {
        roles = roles.filter(r => r.id !== id);
        loadAdminData();
    }
}

function openCategoryModal(index) {
    const modal = document.getElementById("categoryModal");
    const title = document.getElementById("categoryModalTitle");
    const editCategoryIndex = document.getElementById("editCategoryIndex");
    const categoryName = document.getElementById("categoryName");
    if (index != null) {
        title.innerText = "编辑图书分类";
        editCategoryIndex.value = index;
        categoryName.value = categories[index];
    } else {
        title.innerText = "新增图书分类";
        editCategoryIndex.value = "";
        categoryName.value = "";
    }
    modal.style.display = "flex";
}

function closeCategoryModal() {
    document.getElementById("categoryModal").style.display = "none";
}

function saveCategory() {
    let index = document.getElementById("editCategoryIndex").value;
    let name = document.getElementById("categoryName").value.trim();
    if (!name) { showToast("分类名称不能为空"); return; }
    if (index !== "") {
        categories[Number(index)] = name;
    } else {
        categories.push(name);
    }
    closeCategoryModal();
    loadAdminData();
}

function editCategory(index) {
    openCategoryModal(index);
}

async function deleteCategory(index) {
    if (await showConfirm("确认删除该分类吗？")) {
        categories.splice(index, 1);
        loadAdminData();
    }
}

function saveBorrowRules() {
    let maxBorrow = Number(document.getElementById("maxBorrow").value);
    let borrowDays = Number(document.getElementById("borrowDays").value);
    let overdueFee = Number(document.getElementById("overdueFee").value);
    borrowRules.maxBorrow = maxBorrow;
    borrowRules.borrowDays = borrowDays;
    borrowRules.overdueFee = overdueFee;
    showToast("借阅规则已保存。");
}

function backupData() {
    showToast("已模拟备份当前系统数据。实际项目中请调用后端备份接口。支持完整还原。 ");
}

async function restoreDemoData() {
    if (await showConfirm("确认恢复演示数据？当前前端数据将重置。")) {
        books = [
            { id: 1, title: "数据库原理", author: "王珊", isbn: "9787111123456", publisher: "清华大学出版社", category: "计算机" },
            { id: 2, title: "深入理解计算机系统", author: "Randal E. Bryant", isbn: "9787111543456", publisher: "机械工业出版社", category: "计算机" },
            { id: 3, title: "三体", author: "刘慈欣", isbn: "9787229030933", publisher: "重庆出版社", category: "科幻" }
        ];
        borrowRecords = [
            { id: 1, readerName: "张三", bookTitle: "数据库原理", borrowDate: "2025-05-20", dueDate: "2025-06-03", status: "借出中" },
            { id: 2, readerName: "李四", bookTitle: "三体", borrowDate: "2025-05-01", dueDate: "2025-05-15", status: "超期" }
        ];
        readers = [
            { id: 1, cardId: "R001", name: "张三", phone: "13800138001", email: "zhang@example.com" },
            { id: 2, cardId: "R002", name: "李四", phone: "13800138002", email: "li@example.com" }
        ];
        nextBookId = 4;
        nextBorrowId = 3;
        nextReaderId = 3;
        loadBooks();
        loadBorrowRecords();
        loadReaders();
        loadAdminData();
        showToast("演示数据已恢复。");
    }
}

// ======================= 统计报表 (report.html) =======================
function loadReports() {
    let hotBody = document.getElementById("hotBooksBody");
    if(hotBody) {
        let html = "";
        hotBooksStat.forEach((b, idx) => {
            html += `<tr><td>${idx+1}</td><td>${escapeHtml(b.bookTitle)}</td><td>${b.borrowCount}</td></tr>`;
        });
        hotBody.innerHTML = html;
    }
    let activeBody = document.getElementById("activeReadersBody");
    if(activeBody) {
        let html = "";
        activeReadersStat.forEach((r, idx) => {
            html += `<tr><td>${idx+1}</td><td>${escapeHtml(r.name)}</td><td>${r.borrowCount}</td></tr>`;
        });
        activeBody.innerHTML = html;
    }
}

// ======================= 页面加载时自动加载对应数据 =======================
document.addEventListener("DOMContentLoaded", function() {
    const page = window.location.pathname.split("/").pop();
    const session = getSession();

    if (page === "login.html") {
        if (session) {
            window.location.href = "index.html";
        }
        return;
    }

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    refreshTopbar();

    if (page === "index.html" || page === "") {
        loadWelcome();
        return;
    }

    if (page === "books.html") loadBooks();
    if (page === "borrow.html") loadBorrowRecords();
    if (page === "readers.html") loadReaders();
    if (page === "report.html") loadReports();
    if (page === "admin.html") loadAdminData();
});

// 防XSS简单处理
function escapeHtml(str) {
    if(!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if(m === "&") return "&amp;";
        if(m === "<") return "&lt;";
        if(m === ">") return "&gt;";
        return m;
    });
}

// 非阻塞提示（toast）
function showToast(msg, timeout = 2200) {
    try {
        let el = document.getElementById('globalToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'globalToast';
            el.className = 'toast';
            document.body.appendChild(el);
        }
        el.innerText = msg;
        el.classList.add('show');
        clearTimeout(el._hideTimer);
        el._hideTimer = setTimeout(() => el.classList.remove('show'), timeout);
    } catch (e) {
        try { console.warn('showToast fallback', e); } catch (e) {}
    }
}

// 全局非阻塞确认对话（返回 Promise<boolean>）
function showConfirm(message) {
    return new Promise(resolve => {
        let modal = document.getElementById('globalConfirm');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'globalConfirm';
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <p class="confirm-message"></p>
                    <div class="confirm-buttons">
                        <button id="confirmCancel">取消</button>
                        <button id="confirmOk" class="success">确定</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }
        const msgEl = modal.querySelector('.confirm-message');
        const okBtn = modal.querySelector('#confirmOk');
        const cancelBtn = modal.querySelector('#confirmCancel');
        msgEl.innerText = message;
        modal.style.display = 'flex';
        function cleanup(result) {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}