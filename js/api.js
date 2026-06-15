/**
 * API服务层 - 所有模块已对接后端
 */
const API = 'http://localhost:8080';

// ===================== 通用请求 =====================
async function apiGet(p, q = {}) {
    const u = new URL(`${API}${p}`);
    for (const [k, v] of Object.entries(q)) { if (v != null && v !== '') u.searchParams.append(k, String(v)); }
    try { const r = await fetch(u.toString()); const j = await r.json(); return { success: j.code === 200 || j.code === 1, message: j.msg || 'success', data: j.data }; }
    catch (e) { console.warn('[API] GET error:', p, e.message); return { success: false, message: '网络错误', data: null }; }
}
async function apiPost(p, q = {}) {
    const u = `${API}${p}`; const fb = new URLSearchParams(); for (const [k, v] of Object.entries(q)) { if (v != null && v !== '') fb.append(k, String(v)); }
    try { const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fb.toString() }); const j = await r.json(); return { success: j.code === 200 || j.code === 1, message: j.msg || 'success', data: j.data }; }
    catch (e) { console.warn('[API] POST error:', p, e.message); return { success: false, message: '网络错误', data: null }; }
}
async function apiPostJson(p, d) {
    try { const r = await fetch(`${API}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json;charset=UTF-8' }, body: JSON.stringify(d) }); const j = await r.json(); return { success: j.code === 200 || j.code === 1, message: j.msg || 'success', data: j.data }; }
    catch (e) { console.warn('[API] POST error:', p, e.message); return { success: false, message: '网络错误', data: null }; }
}
async function apiPut(p, d) {
    try { const r = await fetch(`${API}${p}`, { method: 'PUT', headers: { 'Content-Type': 'application/json;charset=UTF-8' }, body: JSON.stringify(d) }); const j = await r.json(); return { success: j.code === 200 || j.code === 1, message: j.msg || 'success', data: j.data }; }
    catch (e) { console.warn('[API] PUT error:', p, e.message); return { success: false, message: '网络错误', data: null }; }
}
async function apiDel(p) {
    try { const r = await fetch(`${API}${p}`, { method: 'DELETE' }); const j = await r.json(); return { success: j.code === 200 || j.code === 1, message: j.msg || 'success', data: j.data }; }
    catch (e) { console.warn('[API] DELETE error:', p, e.message); return { success: false, message: '网络错误', data: null }; }
}

function cb(b) { return { id: b.bookId, title: b.bookName, author: b.authorName, isbn: b.isbn, publisher: b.publisherName, category: b.categoryName, total: b.totalCount, available: b.availableCount, status: b.status || (b.availableCount > 0 ? '有货' : '缺货'), borrowCount: b.borrowCount || 0 }; }

// ===================== 图书 ✅ =====================
const bookApi = {
    async list(p = {}) { const r = await apiGet('/bookadmin/book/page', { pageNum: p.pageNum || 1, pageSize: p.pageSize || 8, bookName: p.bookName || '', authorName: p.authorName || '', isbn: p.isbn || '', categoryId: p.categoryId || '', status: p.status || '' }); if (r.success && r.data && r.data.records) { console.log('[DB] 图书数据来自后端API，共' + r.data.total + '条'); r.data.records = r.data.records.map(cb); } return r; },
    async getById(id) { const r = await apiGet('/bookadmin/book/' + id); if (r.success && r.data) r.data = cb(r.data); return r; },
    async add(b) { return apiPostJson('/bookadmin/book/add', { bookName: b.title, isbn: b.isbn, authorName: b.author, categoryName: b.category, publisherName: b.publisher || '', publishDate: b.publishDate || '', price: b.price || 0, totalCount: b.total || 1, availableCount: b.available || 1, status: b.status || '在馆' }); },
    async update(b) { return apiPut('/bookadmin/book', { bookId: b.id, bookName: b.title, isbn: b.isbn, authorName: b.author, categoryName: b.category, publisherName: b.publisher || '', publishDate: b.publishDate || '', price: b.price || 0, totalCount: b.total || 1, availableCount: b.available || 0, status: b.status || '在馆' }); },
    async delete(id) { return apiDel('/bookadmin/book/' + id); }
};

// ===================== 借阅 ✅ =====================
const borrowApi = {
    async lend(readerId, bookId) { return apiPost('/bookadmin/borrow/lend', { readerId, bookId }); },
    async returnBook(borrowId) { return apiPost('/bookadmin/borrow/return', { borrowId }); },
    async renew(borrowId) { return apiPost('/bookadmin/borrow/renew', { borrowId }); },
    async notifyOverdue() { return apiPost('/bookadmin/borrow/notify'); },
    /** 读者个人记录 */
    async myRecords(readerId) { return apiGet('/reader/borrow/list/' + readerId); }
};

// ===================== 读者 ✅ =====================
const readerApi = {
    async list(keyword) { return apiGet('/bookadmin/reader/list', { keyword: keyword || '' }); },
    async add(r) { return apiPostJson('/bookadmin/reader', { readerName: r.name, gender: r.gender || '', phone: r.phone || '', readerType: r.type || '本科生', status: r.status || '正常' }); },
    async update(r) { return apiPut('/bookadmin/reader', { readerId: r.id, readerName: r.name, gender: r.gender || '', phone: r.phone || '', readerType: r.type || '本科生', status: r.status || '正常' }); },
    async delete(id) { return apiDel('/bookadmin/reader/' + id); }
};

// ===================== 统计报表 ✅ =====================
const reportApi = {
    async hotBooks() { return apiGet('/systemadmin/tool/hot-books'); },
    async activeReaders() { return apiGet('/systemadmin/tool/active-readers'); },
    async overdueList() { return apiGet('/systemadmin/tool/overdue-list'); },
    async fineList() { return apiGet('/systemadmin/tool/fine-list'); }
};

// ===================== 分类 ✅ =====================
const categoryApi = {
    async list() { return apiGet('/systemadmin/book/categories'); },
    async add(name) { return apiPostJson('/systemadmin/book/category', { categoryName: name }); },
    async delete(id) { return apiDel('/systemadmin/book/category/' + id); }
};

// ===================== 规则 ✅ =====================
const ruleApi = {
    async list() { return apiGet('/systemadmin/borrow/rules'); },
    async getByType(type) { return apiGet('/systemadmin/borrow/rule/' + type); },
    async save(rule) { return apiPostJson('/systemadmin/borrow/rule', rule); }
};

// ===================== 用户权限 ✅ =====================
const adminApi = {
    async listUsers() { return apiGet('/systemadmin/admin/users'); },
    async addUser(u) { return apiPostJson('/systemadmin/admin/user', u); },
    async updateUser(u) { return apiPut('/systemadmin/admin/user', u); },
    async deleteUser(id) { return apiDel('/systemadmin/admin/user/' + id); }
};

// ===================== 罚款 ✅ =====================
const fineApi = {
    async list() { return apiGet('/systemadmin/tool/fine-list'); }
};

// ===================== 登录/注册 ✅ =====================
const authApi = {
    async login(username, password, role) { return apiPost('/auth/login', { username, password, role }); },
    async register(username, password, role, inviteCode) { return apiPost('/auth/register', { username, password, role, inviteCode }); }
};

// ===================== 邀请码 ✅ =====================
const inviteApi = {
    async list() { return apiGet('/systemadmin/invite/list'); },
    async generate(role, maxUses, expireDays) { return apiPost('/systemadmin/invite/generate', { role, maxUses: maxUses || 1, expireDays: expireDays || 30 }); },
    async revoke(id) { return apiPut('/systemadmin/invite/revoke/' + id); }
};

// ===================== 辅助 =====================
function todayStr() { return new Date().toISOString().slice(0, 10); }
