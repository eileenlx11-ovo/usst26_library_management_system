/**
 * API服务层 - 统一管理所有后端接口调用
 * 后端已实现的接口直接调用，未实现的用mock数据占位
 */
const API_BASE = 'http://localhost:8080';

// ===================== 通用请求函数 =====================

async function apiPost(path, params = {}) {
    const url = `${API_BASE}${path}`;
    const formBody = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== '') formBody.append(key, String(value));
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString()
        });
        const json = await res.json();
        return {
            success: json.code === 1,
            message: json.msg || 'success',
            data: json.data
        };
    } catch (err) {
        console.warn('[API] 请求失败:', path, err.message);
        return { success: false, message: '网络错误，无法连接后端服务器', data: null };
    }
}

async function apiGet(path, params = {}) {
    const url = new URL(`${API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
        if (value != null && value !== '') url.searchParams.append(key, String(value));
    }
    try {
        const res = await fetch(url.toString());
        const json = await res.json();
        return {
            success: json.code === 1,
            message: json.msg || 'success',
            data: json.data
        };
    } catch (err) {
        console.warn('[API] GET请求失败:', path, err.message);
        return { success: false, message: '网络错误，无法连接后端服务器', data: null };
    }
}

// ===================== 借阅模块 API（✅ 后端已实现） =====================

const borrowApi = {
    /** 借书 POST /bookadmin/borrow/lend */
    async lend(readerId, bookId) {
        return apiPost('/bookadmin/borrow/lend', { readerId, bookId });
    },
    /** 还书 POST /bookadmin/borrow/return */
    async returnBook(borrowId) {
        return apiPost('/bookadmin/borrow/return', { borrowId });
    },
    /** 续借 POST /bookadmin/borrow/renew */
    async renew(borrowId) {
        return apiPost('/bookadmin/borrow/renew', { borrowId });
    },
    /** 逾期催还 POST /bookadmin/borrow/notify */
    async notifyOverdue() {
        return apiPost('/bookadmin/borrow/notify');
    }
};

// ===================== 图书模块 API（⚠️ 后端空壳，使用mock） =====================

const bookApi = {
    async list(params = {}) {
        return useMock('bookApi.list', () => {
            let list = MockData.books;
            if (params.keyword) {
                const kw = params.keyword.toLowerCase();
                list = list.filter(b => (b.title + b.author + b.category).toLowerCase().includes(kw));
            }
            if (params.category) {
                list = list.filter(b => b.category === params.category);
            }
            return { success: true, message: 'success', data: list };
        });
    },
    async add(book) {
        return useMock('bookApi.add', () => {
            const b = { ...book, id: MockData.nextBookId(), borrowCount: 0, status: book.available > 0 ? '在馆' : '借空' };
            MockData.books.push(b);
            return { success: true, message: 'success', data: b };
        });
    },
    async update(book) {
        return useMock('bookApi.update', () => {
            const idx = MockData.books.findIndex(b => b.id === book.id);
            if (idx >= 0) MockData.books[idx] = { ...MockData.books[idx], ...book };
            return { success: true, message: 'success', data: null };
        });
    },
    async delete(id) {
        return useMock('bookApi.delete', () => {
            MockData.books = MockData.books.filter(b => b.id !== id);
            return { success: true, message: 'success', data: null };
        });
    }
};

// ===================== 读者模块 API（⚠️ 后端空壳，使用mock） =====================

const readerApi = {
    async list(params = {}) {
        return useMock('readerApi.list', () => {
            let list = MockData.readers;
            if (params.keyword) {
                const kw = params.keyword.toLowerCase();
                list = list.filter(r => (r.name + r.cardId).toLowerCase().includes(kw));
            }
            return { success: true, message: 'success', data: list };
        });
    },
    async add(reader) {
        return useMock('readerApi.add', () => {
            const r = { ...reader, id: MockData.nextReaderId(), registerDate: todayStr() };
            MockData.readers.push(r);
            return { success: true, message: 'success', data: r };
        });
    },
    async update(id, reader) {
        return useMock('readerApi.update', () => {
            const idx = MockData.readers.findIndex(r => r.id === id);
            if (idx >= 0) MockData.readers[idx] = { ...MockData.readers[idx], ...reader };
            return { success: true, message: 'success', data: null };
        });
    },
    async delete(id) {
        return useMock('readerApi.delete', () => {
            MockData.readers = MockData.readers.filter(r => r.id !== id);
            return { success: true, message: 'success', data: null };
        });
    }
};

// ===================== 罚款模块 API（⚠️ 后端空壳，使用mock） =====================

const fineApi = {
    async list() {
        return useMock('fineApi.list', () => {
            return { success: true, message: 'success', data: [...MockData.fines] };
        });
    },
    async pay(fineId) {
        return useMock('fineApi.pay', () => {
            const fine = MockData.fines.find(f => f.fineId === fineId);
            if (fine) { fine.paid = true; fine.payDate = todayStr(); }
            return { success: true, message: 'success', data: null };
        });
    }
};

// ===================== 规则模块 API（⚠️ 后端空壳，使用mock） =====================

const ruleApi = {
    async get(readerType) {
        return useMock('ruleApi.get', () => {
            const rule = MockData.rules.find(r => r.readerType === readerType) || MockData.rules[0];
            return { success: true, message: 'success', data: rule };
        });
    },
    async save(rule) {
        return useMock('ruleApi.save', () => {
            const idx = MockData.rules.findIndex(r => r.readerType === rule.readerType);
            if (idx >= 0) MockData.rules[idx] = rule;
            else MockData.rules.push(rule);
            return { success: true, message: 'success', data: null };
        });
    }
};

// ===================== 分类模块 API（⚠️ 后端空壳，使用mock） =====================

const categoryApi = {
    async list() {
        return useMock('categoryApi.list', () => {
            return { success: true, message: 'success', data: [...MockData.categories] };
        });
    },
    async add(name) {
        return useMock('categoryApi.add', () => {
            if (!MockData.categories.includes(name)) MockData.categories.push(name);
            return { success: true, message: 'success', data: null };
        });
    },
    async delete(name) {
        return useMock('categoryApi.delete', () => {
            MockData.categories = MockData.categories.filter(c => c !== name);
            return { success: true, message: 'success', data: null };
        });
    }
};

// ===================== 统计报表 API（⚠️ 后端空壳，使用mock） =====================

const reportApi = {
    async hotBooks() {
        return useMock('reportApi.hotBooks', () => {
            const sorted = [...MockData.books].sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0)).slice(0, 10);
            return { success: true, message: 'success', data: sorted };
        });
    },
    async activeReaders() {
        return useMock('reportApi.activeReaders', () => {
            const map = new Map();
            MockData.borrowRecords.forEach(r => {
                map.set(r.readerId, (map.get(r.readerId) || 0) + 1);
            });
            const list = MockData.readers.map(r => ({ reader: r, count: map.get(r.id) || 0 }))
                .sort((a, b) => b.count - a.count);
            return { success: true, message: 'success', data: list };
        });
    },
    async overdueList() {
        return useMock('reportApi.overdueList', () => {
            const today = new Date();
            return { success: true, message: 'success', data: MockData.getOverdueRecords(today) };
        });
    }
};

// ===================== Mock 回退辅助 =====================

function useMock(apiName, mockFn) {
    console.warn(`[API] ${apiName}: 后端接口未就绪，使用本地mock数据`);
    return Promise.resolve(mockFn());
}

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
