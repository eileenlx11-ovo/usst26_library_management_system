# 图书馆管理系统前端页面 A

这是一个纯 HTML/CSS/JavaScript 的前端演示包，放在 `D:\program\report\frontend_A`。它不依赖后端服务，直接用浏览器打开即可演示。

## 文件说明

- `index.html`：系统页面入口，包含总览、图书查询、借阅服务、管理工作台、统计报表。
- `styles.css`：页面布局和视觉样式。
- `app.js`：前端交互逻辑和演示数据，数据保存在浏览器 `localStorage`。

## 已完成的前端任务

- 读者端：图书查询、按分类筛选、借阅图书、续借、归还、查看个人借阅记录和罚款。
- 图书管理员端：图书信息维护、读者账号维护、借阅处理、归还处理、逾期催还名单。
- 系统管理员端：图书分类维护、借阅规则设置、热门图书统计、活跃读者统计。
- 数据字段对齐实验 SQL：`Book`、`Category`、`Reader`、`Rule`、`BorrowRecord`、`Fine`。

## 打开方式

1. 演示页面：用 Microsoft Edge、Google Chrome 或 360 浏览器打开 `index.html`。
2. 修改代码：用 Visual Studio Code 打开整个 `D:\program\report\frontend_A` 文件夹。
3. 查看 SQL：用 Navicat、MySQL Workbench 或 DataGrip 打开根目录里的 `.sql` 文件。

## 可选本地服务

如果浏览器限制本地文件访问，可以在该文件夹打开终端并运行：

```powershell
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 后续对接后端建议

当前页面用 `localStorage` 模拟数据库。后续如果后端接口完成，只需要把 `app.js` 中的 `state` 读写替换成 `fetch` 请求，例如：

- 查询图书：`GET /reader/book`
- 办理借阅：`POST /bookadmin/borrow`
- 归还图书：`PUT /bookadmin/borrow/{borrowId}/return`
- 修改规则：`PUT /systemadmin/borrow/rule`
