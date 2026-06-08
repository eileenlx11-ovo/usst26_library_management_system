const storageKey = "library_frontend_a_state";
const today = new Date().toISOString().slice(0, 10);

const seedState = {
  currentRole: "reader",
  currentUserId: "reader-1",
  categories: ["计算机", "文学", "管理", "科普", "历史"],
  books: [
    {
      id: 1001,
      isbn: "9787111123456",
      name: "数据库系统概论",
      author: "王珊",
      publisher: "高等教育出版社",
      category: "计算机",
      total: 6,
      available: 4,
      status: "在馆",
      borrowCount: 12
    },
    {
      id: 1002,
      isbn: "9787111544934",
      name: "深入理解计算机系统",
      author: "Randal E. Bryant",
      publisher: "机械工业出版社",
      category: "计算机",
      total: 3,
      available: 1,
      status: "在馆",
      borrowCount: 9
    },
    {
      id: 1003,
      isbn: "9787229030933",
      name: "三体",
      author: "刘慈欣",
      publisher: "重庆出版社",
      category: "文学",
      total: 5,
      available: 0,
      status: "借空",
      borrowCount: 18
    },
    {
      id: 1004,
      isbn: "9787508649719",
      name: "人类简史",
      author: "尤瓦尔·赫拉利",
      publisher: "中信出版社",
      category: "历史",
      total: 4,
      available: 2,
      status: "在馆",
      borrowCount: 7
    },
    {
      id: 1005,
      isbn: "9787302423287",
      name: "管理信息系统",
      author: "薛华成",
      publisher: "清华大学出版社",
      category: "管理",
      total: 4,
      available: 3,
      status: "在馆",
      borrowCount: 5
    }
  ],
  readers: [
    {
      id: 1,
      card: "R2026001",
      name: "张同学",
      gender: "男",
      phone: "13800000001",
      type: "学生",
      registerDate: "2026-05-01",
      status: "正常"
    },
    {
      id: 2,
      card: "R2026002",
      name: "李老师",
      gender: "女",
      phone: "13800000002",
      type: "教师",
      registerDate: "2026-05-02",
      status: "正常"
    },
    {
      id: 3,
      card: "R2026003",
      name: "陈同学",
      gender: "女",
      phone: "13800000003",
      type: "学生",
      registerDate: "2026-05-08",
      status: "正常"
    }
  ],
  rules: [
    {
      id: 1,
      readerType: "学生",
      maxBorrowDays: 30,
      maxBorrowCount: 5,
      finePerDay: 0.5,
      maxRenewTimes: 1,
      renewDays: 15
    },
    {
      id: 2,
      readerType: "教师",
      maxBorrowDays: 60,
      maxBorrowCount: 10,
      finePerDay: 0.3,
      maxRenewTimes: 2,
      renewDays: 30
    }
  ],
  records: [
    {
      id: 5001,
      readerId: 1,
      bookId: 1001,
      ruleId: 1,
      borrowDate: "2026-05-10",
      dueDate: "2026-06-09",
      returnDate: "",
      renewedTimes: 0,
      overdueDays: 0,
      status: "借阅中"
    },
    {
      id: 5002,
      readerId: 1,
      bookId: 1003,
      ruleId: 1,
      borrowDate: "2026-04-20",
      dueDate: "2026-05-20",
      returnDate: "",
      renewedTimes: 1,
      overdueDays: 0,
      status: "借阅中"
    },
    {
      id: 5003,
      readerId: 2,
      bookId: 1004,
      ruleId: 2,
      borrowDate: "2026-04-01",
      dueDate: "2026-05-31",
      returnDate: "2026-06-05",
      renewedTimes: 0,
      overdueDays: 5,
      status: "已归还"
    }
  ],
  fines: [
    {
      id: 8001,
      recordId: 5003,
      amount: 1.5,
      paid: false,
      createDate: "2026-06-05",
      payDate: ""
    }
  ]
};

let state = loadState();

const viewTitles = {
  dashboard: "总览",
  catalog: "图书查询",
  borrow: "借阅服务",
  manage: "管理工作台",
  reports: "统计报表"
};

const roleProfiles = {
  reader: {
    label: "读者",
    note: "可查询图书、借阅、续借、归还并查看个人记录。"
  },
  librarian: {
    label: "图书管理员",
    note: "可维护图书和读者，处理借阅、归还、催还。"
  },
  admin: {
    label: "系统管理员",
    note: "可设置规则、维护分类，并查看统计报表。"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  syncRoleSelectors();
  switchView("dashboard");
  renderAll();
  showToast("前端A演示页面已加载");
});

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return cloneSeedState();
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("演示数据损坏，已恢复默认数据", error);
    return cloneSeedState();
  }
}

function cloneSeedState() {
  return JSON.parse(JSON.stringify(seedState));
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.getElementById("roleSelect").addEventListener("change", (event) => {
    state.currentRole = event.target.value;
    syncRoleSelectors();
    saveState();
    renderAll();
  });

  document.getElementById("userSelect").addEventListener("change", (event) => {
    state.currentUserId = event.target.value;
    saveState();
    renderAll();
  });

  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    state = cloneSeedState();
    saveState();
    syncRoleSelectors();
    renderAll();
    showToast("已恢复默认演示数据");
  });

  ["bookSearchInput", "categoryFilter", "availabilityFilter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderBooks);
  });

  document.getElementById("recordStatusFilter").addEventListener("change", renderRecords);
  document.getElementById("borrowForm").addEventListener("submit", submitBorrowForm);
  document.getElementById("bookForm").addEventListener("submit", submitBookForm);
  document.getElementById("readerForm").addEventListener("submit", submitReaderForm);
  document.getElementById("ruleForm").addEventListener("submit", submitRuleForm);
  document.getElementById("categoryForm").addEventListener("submit", submitCategoryForm);
  document.getElementById("clearBookFormBtn").addEventListener("click", clearBookForm);
  document.getElementById("clearReaderFormBtn").addEventListener("click", clearReaderForm);
  document.getElementById("quickAddBookBtn").addEventListener("click", () => {
    switchView("manage");
    document.getElementById("bookName").focus();
  });
  document.getElementById("ruleReaderType").addEventListener("change", fillRuleForm);
}

function syncRoleSelectors() {
  const roleSelect = document.getElementById("roleSelect");
  const userSelect = document.getElementById("userSelect");
  roleSelect.value = state.currentRole;
  userSelect.innerHTML = "";

  const options = getUsersForRole(state.currentRole);
  options.forEach((user) => {
    userSelect.appendChild(createOption(user.id, user.name));
  });

  if (!options.some((user) => user.id === state.currentUserId)) {
    state.currentUserId = options[0]?.id || "";
  }
  userSelect.value = state.currentUserId;
}

function getUsersForRole(role) {
  if (role === "reader") {
    return state.readers.map((reader) => ({
      id: `reader-${reader.id}`,
      name: `${reader.name}（${reader.card}）`
    }));
  }
  if (role === "librarian") {
    return [
      { id: "librarian-1", name: "馆员A" },
      { id: "librarian-2", name: "馆员B" }
    ];
  }
  return [
    { id: "admin-1", name: "系统管理员" }
  ];
}

function switchView(viewName) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `${viewName}View`);
  });
  document.getElementById("pageTitle").textContent = viewTitles[viewName];
}

function renderAll() {
  document.getElementById("todayText").textContent = `今天：${today}`;
  document.getElementById("roleNote").textContent = roleProfiles[state.currentRole].note;
  applyRoleAccess();
  renderDashboard();
  renderFilters();
  renderBooks();
  renderBorrowFormDefaults();
  renderRuleSummary();
  renderRecords();
  renderFines();
  renderReadersDatalist();
  renderManagementHelpers();
  renderReaderManagementTable();
  renderReports();
  fillRuleForm();
}

function applyRoleAccess() {
  const isReader = state.currentRole === "reader";
  const isLibrarian = state.currentRole === "librarian";
  const isAdmin = state.currentRole === "admin";

  document.getElementById("borrowForm").classList.toggle("readonly", isAdmin);
  document.getElementById("bookForm").classList.toggle("readonly", isReader);
  document.getElementById("readerForm").classList.toggle("readonly", isReader);
  document.getElementById("ruleForm").classList.toggle("readonly", !isAdmin);
  document.getElementById("categoryForm").classList.toggle("readonly", !isAdmin);

  document.querySelectorAll(".role-librarian").forEach((element) => {
    element.disabled = !(isLibrarian || isAdmin);
  });
  document.querySelectorAll(".role-admin").forEach((element) => {
    if (element.classList.contains("role-librarian")) {
      return;
    }
    element.disabled = !isAdmin;
  });
}

function renderDashboard() {
  updateLiveRecordStatus();
  const totalBooks = state.books.reduce((sum, book) => sum + book.total, 0);
  const availableBooks = state.books.reduce((sum, book) => sum + book.available, 0);
  const activeRecords = state.records.filter((record) => record.status !== "已归还");
  const unpaidFine = state.fines
    .filter((fine) => !fine.paid)
    .reduce((sum, fine) => sum + fine.amount, 0);

  document.getElementById("metricBooks").textContent = totalBooks;
  document.getElementById("metricAvailable").textContent = availableBooks;
  document.getElementById("metricBorrowing").textContent = activeRecords.length;
  document.getElementById("metricFine").textContent = unpaidFine.toFixed(2);

  const todos = getTodos();
  document.getElementById("todoCount").textContent = `${todos.length} 项`;
  document.getElementById("todoList").innerHTML = todos.length
    ? todos.map((todo) => `
        <div class="todo-item">
          <div>
            <strong>${escapeHtml(todo.title)}</strong>
            <span>${escapeHtml(todo.detail)}</span>
          </div>
          <span class="tag">${escapeHtml(todo.type)}</span>
        </div>
      `).join("")
    : `<div class="empty">暂无待处理事项</div>`;
}

function getTodos() {
  const overdue = getActiveRecords().filter((record) => getOverdueDays(record) > 0);
  const lowStock = state.books.filter((book) => book.available === 0);
  const unpaid = state.fines.filter((fine) => !fine.paid);
  const todos = [];

  overdue.forEach((record) => {
    const reader = getReader(record.readerId);
    const book = getBook(record.bookId);
    todos.push({
      title: `${reader.name} 的图书已逾期`,
      detail: `${book.name}，逾期 ${getOverdueDays(record)} 天`,
      type: "催还"
    });
  });

  lowStock.forEach((book) => {
    todos.push({
      title: `${book.name} 库存不足`,
      detail: "当前可借册数为 0，建议补充馆藏或提醒预约",
      type: "库存"
    });
  });

  if (unpaid.length) {
    todos.push({
      title: "存在未缴罚款",
      detail: `共 ${unpaid.length} 条 Fine 记录未缴纳`,
      type: "罚款"
    });
  }

  return todos.slice(0, 6);
}

function renderFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const previous = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">全部分类</option>`;
  state.categories.forEach((category) => categoryFilter.appendChild(createOption(category, category)));
  categoryFilter.value = previous;
}

function renderBooks() {
  const keyword = document.getElementById("bookSearchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const availability = document.getElementById("availabilityFilter").value;

  const books = state.books.filter((book) => {
    const hitKeyword = !keyword || [book.name, book.author, book.isbn, book.category].some((field) => {
      return String(field).toLowerCase().includes(keyword);
    });
    const hitCategory = !category || book.category === category;
    const hitAvailability = !availability
      || (availability === "available" && book.available > 0)
      || (availability === "empty" && book.available === 0);
    return hitKeyword && hitCategory && hitAvailability;
  });

  document.getElementById("bookTableBody").innerHTML = books.length
    ? books.map((book) => renderBookRow(book)).join("")
    : `<tr><td colspan="8" class="empty">没有找到匹配的图书</td></tr>`;
}

function renderBookRow(book) {
  const isAvailable = book.available > 0;
  const statusClass = isAvailable ? "ok" : "warn";
  const statusText = isAvailable ? "可借" : "借空";
  const managerActions = state.currentRole === "reader"
    ? ""
    : `
      <button class="small-btn secondary" onclick="editBook(${book.id})">编辑</button>
      <button class="small-btn danger" onclick="deleteBook(${book.id})">删除</button>
    `;
  return `
    <tr>
      <td>${book.id}</td>
      <td>${escapeHtml(book.name)}</td>
      <td>${escapeHtml(book.author)}</td>
      <td>${escapeHtml(book.isbn)}</td>
      <td>${escapeHtml(book.category)}</td>
      <td>${book.available}/${book.total}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td>
        <div class="row-actions">
          <button class="small-btn" onclick="borrowBookById(${book.id})" ${isAvailable ? "" : "disabled"}>借阅</button>
          ${managerActions}
        </div>
      </td>
    </tr>
  `;
}

function renderBorrowFormDefaults() {
  const reader = getCurrentReader();
  if (reader) {
    document.getElementById("borrowReaderCard").value = reader.card;
  }
}

function renderReadersDatalist() {
  document.getElementById("readerCards").innerHTML = state.readers
    .map((reader) => `<option value="${escapeHtml(reader.card)}">${escapeHtml(reader.name)}</option>`)
    .join("");
}

function renderRuleSummary() {
  const reader = getCurrentReader() || state.readers[0];
  const rule = getRuleForType(reader.type);
  document.getElementById("currentRuleLabel").textContent = `${reader.type}规则`;
  document.getElementById("ruleSummary").innerHTML = `
    <div><strong>${rule.maxBorrowDays} 天</strong><span>最大借阅天数</span></div>
    <div><strong>${rule.maxBorrowCount} 本</strong><span>最大借阅数量</span></div>
    <div><strong>${rule.finePerDay.toFixed(2)} 元/天</strong><span>每日逾期费</span></div>
    <div><strong>${rule.maxRenewTimes} 次</strong><span>最大续借次数</span></div>
    <div><strong>${rule.renewDays} 天</strong><span>每次续借天数</span></div>
    <div><strong>${getReaderActiveCount(reader.id)} 本</strong><span>当前借阅数量</span></div>
  `;
}

function renderRecords() {
  updateLiveRecordStatus();
  const status = document.getElementById("recordStatusFilter").value;
  const rows = state.records
    .filter((record) => !status || getDisplayRecordStatus(record) === status)
    .filter((record) => state.currentRole !== "reader" || record.readerId === getCurrentReader()?.id)
    .map((record) => renderRecordRow(record));

  document.getElementById("recordTableBody").innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="8" class="empty">暂无借阅记录</td></tr>`;
}

function renderRecordRow(record) {
  const reader = getReader(record.readerId);
  const book = getBook(record.bookId);
  const rule = getRule(record.ruleId);
  const status = getDisplayRecordStatus(record);
  const overdueDays = getOverdueDays(record);
  const canRenew = record.status !== "已归还" && record.renewedTimes < rule.maxRenewTimes && overdueDays === 0;
  const canReturn = record.status !== "已归还";
  const statusClass = status === "已归还" ? "ok" : status === "逾期" ? "bad" : "warn";
  return `
    <tr>
      <td>${record.id}</td>
      <td>${escapeHtml(reader.name)}<br><small>${escapeHtml(reader.card)}</small></td>
      <td>${escapeHtml(book.name)}</td>
      <td>${record.borrowDate}</td>
      <td>${record.dueDate}</td>
      <td><span class="status ${statusClass}">${status}${overdueDays > 0 ? ` ${overdueDays}天` : ""}</span></td>
      <td>${record.renewedTimes}/${rule.maxRenewTimes}</td>
      <td>
        <div class="row-actions">
          <button class="small-btn secondary" onclick="renewRecord(${record.id})" ${canRenew ? "" : "disabled"}>续借</button>
          <button class="small-btn warning" onclick="returnRecord(${record.id})" ${canReturn ? "" : "disabled"}>归还</button>
        </div>
      </td>
    </tr>
  `;
}

function renderFines() {
  const fines = state.fines.filter((fine) => {
    const record = state.records.find((item) => item.id === fine.recordId);
    return state.currentRole !== "reader" || record?.readerId === getCurrentReader()?.id;
  });

  document.getElementById("fineTableBody").innerHTML = fines.length
    ? fines.map((fine) => {
        return `
          <tr>
            <td>${fine.id}</td>
            <td>${fine.recordId}</td>
            <td>${fine.amount.toFixed(2)} 元</td>
            <td>${fine.createDate}</td>
            <td><span class="status ${fine.paid ? "ok" : "bad"}">${fine.paid ? "已缴纳" : "未缴纳"}</span></td>
            <td><button class="small-btn" onclick="payFine(${fine.id})" ${fine.paid ? "disabled" : ""}>缴纳</button></td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="6" class="empty">暂无罚款记录</td></tr>`;
}

function renderManagementHelpers() {
  document.getElementById("categoryNames").innerHTML = state.categories
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");

  document.getElementById("categoryChipList").innerHTML = state.categories.map((category) => `
    <span class="chip">
      ${escapeHtml(category)}
      <button title="删除分类" onclick="deleteCategory('${escapeAttribute(category)}')">×</button>
    </span>
  `).join("");
}

function renderReaderManagementTable() {
  document.getElementById("readerManageTableBody").innerHTML = state.readers.map((reader) => `
    <tr>
      <td>${reader.id}</td>
      <td>${escapeHtml(reader.card)}</td>
      <td>${escapeHtml(reader.name)}</td>
      <td>${escapeHtml(reader.type)}</td>
      <td>${escapeHtml(reader.phone)}</td>
      <td><span class="status ${reader.status === "正常" ? "ok" : "bad"}">${escapeHtml(reader.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="small-btn secondary" onclick="editReader(${reader.id})">编辑</button>
          <button class="small-btn danger" onclick="deleteReader(${reader.id})">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function renderReports() {
  renderHotBooks();
  renderActiveReaders();
  renderOverdueTable();
}

function renderHotBooks() {
  const sorted = [...state.books].sort((first, second) => second.borrowCount - first.borrowCount).slice(0, 5);
  const max = Math.max(...sorted.map((book) => book.borrowCount), 1);
  document.getElementById("hotBookBars").innerHTML = sorted.map((book) => {
    const width = Math.round((book.borrowCount / max) * 100);
    return `
      <div class="bar-row">
        <strong>${escapeHtml(book.name)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <span>${book.borrowCount}</span>
      </div>
    `;
  }).join("");
}

function renderActiveReaders() {
  const countMap = new Map();
  state.records.forEach((record) => {
    countMap.set(record.readerId, (countMap.get(record.readerId) || 0) + 1);
  });
  const sorted = state.readers
    .map((reader) => ({ reader, count: countMap.get(reader.id) || 0 }))
    .sort((first, second) => second.count - first.count);
  const max = Math.max(...sorted.map((item) => item.count), 1);

  document.getElementById("activeReaderBars").innerHTML = sorted.map((item) => {
    const width = Math.round((item.count / max) * 100);
    return `
      <div class="bar-row">
        <strong>${escapeHtml(item.reader.name)}</strong>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <span>${item.count}</span>
      </div>
    `;
  }).join("");
}

function renderOverdueTable() {
  const rows = getActiveRecords()
    .filter((record) => getOverdueDays(record) > 0)
    .map((record) => {
      const reader = getReader(record.readerId);
      const book = getBook(record.bookId);
      const rule = getRule(record.ruleId);
      const days = getOverdueDays(record);
      return `
        <tr>
          <td>${escapeHtml(reader.name)}</td>
          <td>${escapeHtml(reader.phone)}</td>
          <td>${escapeHtml(book.name)}</td>
          <td>${record.dueDate}</td>
          <td>${days}</td>
          <td>${(days * rule.finePerDay).toFixed(2)} 元</td>
        </tr>
      `;
    });

  document.getElementById("overdueTableBody").innerHTML = rows.length
    ? rows.join("")
    : `<tr><td colspan="6" class="empty">暂无逾期记录</td></tr>`;
}

function submitBorrowForm(event) {
  event.preventDefault();
  if (state.currentRole === "admin") {
    showToast("系统管理员不办理借阅，请切换读者或图书管理员角色");
    return;
  }

  const card = document.getElementById("borrowReaderCard").value.trim();
  const bookId = Number(document.getElementById("borrowBookId").value);
  const reader = state.readers.find((item) => item.card === card);
  if (!reader) {
    showToast("未找到该借书证号");
    return;
  }
  borrowBook(reader.id, bookId);
}

function borrowBookById(bookId) {
  const reader = getCurrentReader();
  if (state.currentRole !== "reader" && state.currentRole !== "librarian") {
    showToast("请切换到读者或图书管理员角色办理借阅");
    return;
  }
  if (state.currentRole === "librarian") {
    switchView("borrow");
    document.getElementById("borrowBookId").value = bookId;
    document.getElementById("borrowReaderCard").focus();
    showToast("请补充借书证号后办理借阅");
    return;
  }
  borrowBook(reader.id, bookId);
}

function borrowBook(readerId, bookId) {
  const reader = getReader(readerId);
  const book = getBook(bookId);
  if (!reader || !book) {
    showToast("读者或图书不存在");
    return;
  }
  if (reader.status !== "正常") {
    showToast("该读者账号状态不可借阅");
    return;
  }
  if (book.available <= 0) {
    showToast("该图书当前无可借库存");
    return;
  }
  const rule = getRuleForType(reader.type);
  if (getReaderActiveCount(reader.id) >= rule.maxBorrowCount) {
    showToast("已达到最大借阅数量");
    return;
  }

  const record = {
    id: nextId(state.records, 5001),
    readerId: reader.id,
    bookId: book.id,
    ruleId: rule.id,
    borrowDate: today,
    dueDate: addDays(today, rule.maxBorrowDays),
    returnDate: "",
    renewedTimes: 0,
    overdueDays: 0,
    status: "借阅中"
  };
  state.records.push(record);
  book.available -= 1;
  book.borrowCount += 1;
  book.status = book.available > 0 ? "在馆" : "借空";
  saveState();
  renderAll();
  showToast(`已借出《${book.name}》，应还日期 ${record.dueDate}`);
}

function renewRecord(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record || record.status === "已归还") {
    return;
  }
  const rule = getRule(record.ruleId);
  if (record.renewedTimes >= rule.maxRenewTimes) {
    showToast("该记录已达到最大续借次数");
    return;
  }
  if (getOverdueDays(record) > 0) {
    showToast("逾期记录不能续借，请先归还并处理罚款");
    return;
  }
  record.dueDate = addDays(record.dueDate, rule.renewDays);
  record.renewedTimes += 1;
  saveState();
  renderAll();
  showToast(`续借成功，新应还日期 ${record.dueDate}`);
}

function returnRecord(recordId) {
  const record = state.records.find((item) => item.id === recordId);
  if (!record || record.status === "已归还") {
    return;
  }
  const book = getBook(record.bookId);
  const rule = getRule(record.ruleId);
  const overdueDays = getOverdueDays(record);
  record.returnDate = today;
  record.overdueDays = overdueDays;
  record.status = "已归还";
  book.available = Math.min(book.total, book.available + 1);
  book.status = book.available > 0 ? "在馆" : "借空";

  if (overdueDays > 0 && !state.fines.some((fine) => fine.recordId === record.id)) {
    state.fines.push({
      id: nextId(state.fines, 8001),
      recordId: record.id,
      amount: Number((overdueDays * rule.finePerDay).toFixed(2)),
      paid: false,
      createDate: today,
      payDate: ""
    });
  }

  saveState();
  renderAll();
  showToast(overdueDays > 0 ? `已归还，产生逾期罚款 ${(overdueDays * rule.finePerDay).toFixed(2)} 元` : "归还成功");
}

function payFine(fineId) {
  const fine = state.fines.find((item) => item.id === fineId);
  if (!fine) {
    return;
  }
  fine.paid = true;
  fine.payDate = today;
  saveState();
  renderAll();
  showToast("罚款状态已更新为已缴纳");
}

function submitBookForm(event) {
  event.preventDefault();
  if (state.currentRole === "reader") {
    showToast("读者角色不能维护图书信息");
    return;
  }

  const id = Number(document.getElementById("bookId").value);
  const book = {
    id: id || nextId(state.books, 1001),
    name: document.getElementById("bookName").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    isbn: document.getElementById("bookIsbn").value.trim(),
    publisher: document.getElementById("bookPublisher").value.trim(),
    category: document.getElementById("bookCategory").value.trim(),
    total: Number(document.getElementById("bookTotal").value),
    available: Number(document.getElementById("bookAvailable").value),
    status: "在馆",
    borrowCount: 0
  };

  if (book.available > book.total) {
    showToast("可借册数不能大于总册数");
    return;
  }
  if (!state.categories.includes(book.category)) {
    state.categories.push(book.category);
  }

  const index = state.books.findIndex((item) => item.id === id);
  if (index >= 0) {
    book.borrowCount = state.books[index].borrowCount;
    state.books[index] = book;
  } else {
    state.books.push(book);
  }
  book.status = book.available > 0 ? "在馆" : "借空";

  saveState();
  clearBookForm();
  renderAll();
  showToast("图书信息已保存");
}

function editBook(bookId) {
  const book = getBook(bookId);
  if (!book) {
    return;
  }
  switchView("manage");
  document.getElementById("bookId").value = book.id;
  document.getElementById("bookName").value = book.name;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookIsbn").value = book.isbn;
  document.getElementById("bookPublisher").value = book.publisher;
  document.getElementById("bookCategory").value = book.category;
  document.getElementById("bookTotal").value = book.total;
  document.getElementById("bookAvailable").value = book.available;
  document.getElementById("bookName").focus();
}

function deleteBook(bookId) {
  if (state.records.some((record) => record.bookId === bookId)) {
    showToast("该图书已有借阅记录，建议改为库存 0 或借空状态");
    return;
  }
  state.books = state.books.filter((book) => book.id !== bookId);
  saveState();
  renderAll();
  showToast("图书已删除");
}

function clearBookForm() {
  document.getElementById("bookForm").reset();
  document.getElementById("bookId").value = "";
}

function submitReaderForm(event) {
  event.preventDefault();
  if (state.currentRole === "reader") {
    showToast("读者角色不能维护读者账号");
    return;
  }

  const id = Number(document.getElementById("readerId").value);
  const reader = {
    id: id || nextId(state.readers, 1),
    card: document.getElementById("readerCard").value.trim(),
    name: document.getElementById("readerName").value.trim(),
    gender: document.getElementById("readerGender").value,
    phone: document.getElementById("readerPhone").value.trim(),
    type: document.getElementById("readerType").value,
    registerDate: today,
    status: document.getElementById("readerStatus").value
  };

  const duplicate = state.readers.some((item) => item.card === reader.card && item.id !== id);
  if (duplicate) {
    showToast("借书证号已存在");
    return;
  }

  const index = state.readers.findIndex((item) => item.id === id);
  if (index >= 0) {
    reader.registerDate = state.readers[index].registerDate;
    state.readers[index] = reader;
  } else {
    state.readers.push(reader);
  }

  saveState();
  clearReaderForm();
  syncRoleSelectors();
  renderAll();
  showToast("读者信息已保存");
}

function editReader(readerId) {
  const reader = getReader(readerId);
  if (!reader) {
    return;
  }
  switchView("manage");
  document.getElementById("readerId").value = reader.id;
  document.getElementById("readerCard").value = reader.card;
  document.getElementById("readerName").value = reader.name;
  document.getElementById("readerGender").value = reader.gender;
  document.getElementById("readerPhone").value = reader.phone;
  document.getElementById("readerType").value = reader.type;
  document.getElementById("readerStatus").value = reader.status;
  document.getElementById("readerCard").focus();
}

function clearReaderForm() {
  document.getElementById("readerForm").reset();
  document.getElementById("readerId").value = "";
}

function deleteReader(readerId) {
  if (state.currentRole === "reader") {
    showToast("读者角色不能删除账号");
    return;
  }
  if (state.records.some((record) => record.readerId === readerId)) {
    showToast("该读者已有借阅记录，建议改为停用状态");
    return;
  }
  state.readers = state.readers.filter((reader) => reader.id !== readerId);
  saveState();
  syncRoleSelectors();
  renderAll();
  showToast("读者账号已删除");
}

function submitRuleForm(event) {
  event.preventDefault();
  if (state.currentRole !== "admin") {
    showToast("只有系统管理员可以修改借阅规则");
    return;
  }
  const readerType = document.getElementById("ruleReaderType").value;
  const rule = getRuleForType(readerType);
  rule.maxBorrowDays = Number(document.getElementById("ruleDays").value);
  rule.maxBorrowCount = Number(document.getElementById("ruleCount").value);
  rule.finePerDay = Number(document.getElementById("ruleFine").value);
  rule.maxRenewTimes = Number(document.getElementById("ruleRenewTimes").value);
  rule.renewDays = Number(document.getElementById("ruleRenewDays").value);
  saveState();
  renderAll();
  showToast("借阅规则已保存");
}

function fillRuleForm() {
  const readerType = document.getElementById("ruleReaderType").value || "学生";
  const rule = getRuleForType(readerType);
  document.getElementById("ruleDays").value = rule.maxBorrowDays;
  document.getElementById("ruleCount").value = rule.maxBorrowCount;
  document.getElementById("ruleFine").value = rule.finePerDay;
  document.getElementById("ruleRenewTimes").value = rule.maxRenewTimes;
  document.getElementById("ruleRenewDays").value = rule.renewDays;
}

function submitCategoryForm(event) {
  event.preventDefault();
  if (state.currentRole !== "admin") {
    showToast("只有系统管理员可以维护分类");
    return;
  }
  const input = document.getElementById("newCategory");
  const category = input.value.trim();
  if (state.categories.includes(category)) {
    showToast("分类已存在");
    return;
  }
  state.categories.push(category);
  input.value = "";
  saveState();
  renderAll();
  showToast("分类已添加");
}

function deleteCategory(category) {
  if (state.currentRole !== "admin") {
    showToast("只有系统管理员可以删除分类");
    return;
  }
  if (state.books.some((book) => book.category === category)) {
    showToast("该分类已有图书使用，不能删除");
    return;
  }
  state.categories = state.categories.filter((item) => item !== category);
  saveState();
  renderAll();
  showToast("分类已删除");
}

function updateLiveRecordStatus() {
  state.records.forEach((record) => {
    if (record.status === "已归还") {
      return;
    }
    record.status = getOverdueDays(record) > 0 ? "逾期" : "借阅中";
  });
}

function getActiveRecords() {
  return state.records.filter((record) => record.status !== "已归还");
}

function getDisplayRecordStatus(record) {
  if (record.status === "已归还") {
    return "已归还";
  }
  return getOverdueDays(record) > 0 ? "逾期" : "借阅中";
}

function getOverdueDays(record) {
  if (record.status === "已归还") {
    return record.overdueDays || 0;
  }
  return Math.max(daysBetween(record.dueDate, today), 0);
}

function getReaderActiveCount(readerId) {
  return state.records.filter((record) => record.readerId === readerId && record.status !== "已归还").length;
}

function getCurrentReader() {
  if (!state.currentUserId.startsWith("reader-")) {
    return state.readers[0];
  }
  const readerId = Number(state.currentUserId.replace("reader-", ""));
  return getReader(readerId);
}

function getReader(readerId) {
  return state.readers.find((reader) => reader.id === Number(readerId)) || {
    id: 0,
    card: "-",
    name: "未知读者",
    phone: "-",
    type: "学生"
  };
}

function getBook(bookId) {
  return state.books.find((book) => book.id === Number(bookId));
}

function getRule(ruleId) {
  return state.rules.find((rule) => rule.id === Number(ruleId)) || state.rules[0];
}

function getRuleForType(readerType) {
  return state.rules.find((rule) => rule.readerType === readerType) || state.rules[0];
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.floor((end - start) / 86400000);
}

function nextId(list, fallback) {
  return list.length ? Math.max(...list.map((item) => Number(item.id))) + 1 : fallback;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\\/g, "\\\\");
}

window.borrowBookById = borrowBookById;
window.renewRecord = renewRecord;
window.returnRecord = returnRecord;
window.payFine = payFine;
window.editBook = editBook;
window.deleteBook = deleteBook;
window.editReader = editReader;
window.deleteReader = deleteReader;
window.deleteCategory = deleteCategory;
