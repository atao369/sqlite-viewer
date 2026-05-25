<div align="center">

# 🗄️ SQLite Viewer

**A lightweight SQLite database browser with schema inspection, data preview, and Markdown export.**

[![GitHub](https://img.shields.io/badge/GitHub-atao369/sqlite--viewer-blue?logo=github)](https://github.com/atao369/sqlite-viewer)
[![Gitee](https://img.shields.io/badge/Gitee-atao369/sqlite--viewer-red?logo=gitee)](https://gitee.com/atao369/sqlite-viewer)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[English](#english) · [中文](#中文)

</div>

---

<a id="english"></a>

## ✨ Features

- 📂 **Open `.db` files** — Via file browse dialog or drag & drop
- 📋 **Schema viewer** — Inspect table columns, types, nullable, primary keys, and indexes
- 📊 **Data browser** — Paginated table data with row count display
- 📝 **Markdown export** — Export table schemas and data in clean Markdown format
- 🔍 **Table navigation** — Sidebar table list with quick switching
- 🖥️ **Dual mode** — Server mode (Node.js + better-sqlite3) and Web mode (sql.js WASM)

## 📸 Screenshots

> Schema view with column details, type info, and constraint indicators

> Data view with paginated browsing and row count

> Markdown export of schema and data

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 8

### Installation

```bash
git clone https://github.com/atao369/sqlite-viewer.git
cd sqlite-viewer
npm install
```

### Run in Server Mode (Recommended)

Server mode uses native `better-sqlite3` for reliable database access and includes a file browse dialog.

```bash
# Build the frontend first
npm run build

# Start the local server (opens browser automatically)
npm start
```

The app will be available at **http://localhost:3456**

### Run in Web Mode (Development)

Web mode runs entirely in the browser using sql.js (WASM). Note: WASM loading may fail in some environments.

```bash
npm run dev
```

## 📁 Project Structure

```
sqlite-viewer/
├── server.cjs              # Node.js HTTP server (better-sqlite3 backend)
├── src/
│   ├── App.tsx              # Main application with ErrorBoundary
│   ├── main.tsx             # React entry point
│   ├── components/
│   │   ├── DataGrid.tsx     # Paginated data table
│   │   ├── FileUploader.tsx # Drag & drop file upload (Web mode)
│   │   ├── SchemaView.tsx   # Table schema inspector
│   │   ├── TableList.tsx    # Sidebar table navigation
│   │   └── TableViewer.tsx  # Main panel (schema/data tabs + export)
│   ├── utils/
│   │   ├── database.ts     # Database abstraction (Web/Server mode)
│   │   └── export.ts       # Markdown export utilities
│   └── types/
│       └── sql.js.d.ts     # sql.js type declarations
├── tests/
│   ├── database.test.ts    # Database layer tests
│   └── export.test.ts      # Export utility tests
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## 🏗️ Architecture

### Dual-Mode Design

| | Server Mode | Web Mode |
|---|---|---|
| **Backend** | Node.js + better-sqlite3 | sql.js (WASM) |
| **File Access** | System file dialog | Browser drag & drop |
| **Reliability** | ✅ High | ⚠️ WASM may fail in some browsers |
| **Port** | 3456 | 5173 (Vite dev) |

The app auto-detects the mode: if running on `localhost:3456`, it uses Server mode; otherwise, it falls back to Web mode.

### API Endpoints (Server Mode)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tables` | GET | List all tables in the database |
| `/api/table-info?name=<table>` | GET | Get schema info for a table |
| `/api/table-data?name=<table>&page=<n>&pageSize=<n>` | GET | Get paginated table data |
| `/api/all-table-data?name=<table>` | GET | Get all data (for export) |
| `/api/open-file-dialog` | POST | Open native file browse dialog |
| `/api/open-file` | POST | Open a specific .db file by path |

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + MUI 5 + Tailwind CSS
- **Backend**: Node.js + better-sqlite3
- **Build**: Vite 5
- **Testing**: Vitest

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<a id="中文"></a>

## ✨ 功能特性

- 📂 **打开 `.db` 文件** — 支持文件浏览对话框或拖拽上传
- 📋 **表结构查看** — 检查列名、类型、是否可空、主键、索引等信息
- 📊 **数据浏览** — 分页浏览表数据，显示行数统计
- 📝 **Markdown 导出** — 以整洁的 Markdown 格式导出表结构和数据
- 🔍 **表导航** — 侧边栏表列表，快速切换
- 🖥️ **双模式运行** — 服务器模式（Node.js + better-sqlite3）和 Web 模式（sql.js WASM）

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) ≥ 18
- npm ≥ 8

### 安装

```bash
git clone https://gitee.com/atao369/sqlite-viewer.git
cd sqlite-viewer
npm install
```

### 服务器模式运行（推荐）

服务器模式使用原生 `better-sqlite3` 读取数据库，可靠性高，并支持文件浏览对话框。

```bash
# 先构建前端
npm run build

# 启动本地服务器（自动打开浏览器）
npm start
```

访问地址：**http://localhost:3456**

### Web 模式运行（开发调试）

Web 模式完全在浏览器中运行，使用 sql.js（WASM）。注意：部分环境下 WASM 加载可能失败。

```bash
npm run dev
```

## 📁 项目结构

```
sqlite-viewer/
├── server.cjs              # Node.js HTTP 服务器（better-sqlite3 后端）
├── src/
│   ├── App.tsx              # 主应用（含 ErrorBoundary）
│   ├── main.tsx             # React 入口
│   ├── components/
│   │   ├── DataGrid.tsx     # 分页数据表格
│   │   ├── FileUploader.tsx # 拖拽上传组件（Web 模式）
│   │   ├── SchemaView.tsx   # 表结构查看器
│   │   ├── TableList.tsx    # 侧边栏表导航
│   │   └── TableViewer.tsx  # 主面板（结构/数据标签页 + 导出）
│   ├── utils/
│   │   ├── database.ts     # 数据库抽象层（Web/服务器模式）
│   │   └── export.ts       # Markdown 导出工具
│   └── types/
│       └── sql.js.d.ts     # sql.js 类型声明
├── tests/
│   ├── database.test.ts    # 数据库层测试
│   └── export.test.ts      # 导出工具测试
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## 🏗️ 架构设计

### 双模式设计

| | 服务器模式 | Web 模式 |
|---|---|---|
| **后端** | Node.js + better-sqlite3 | sql.js (WASM) |
| **文件访问** | 系统文件对话框 | 浏览器拖拽上传 |
| **可靠性** | ✅ 高 | ⚠️ 部分浏览器 WASM 加载可能失败 |
| **端口** | 3456 | 5173（Vite 开发服务器） |

应用自动检测运行模式：如果在 `localhost:3456` 运行，使用服务器模式；否则回退到 Web 模式。

### API 接口（服务器模式）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/tables` | GET | 列出数据库中所有表 |
| `/api/table-info?name=<表名>` | GET | 获取表结构信息 |
| `/api/table-data?name=<表名>&page=<n>&pageSize=<n>` | GET | 获取分页表数据 |
| `/api/all-table-data?name=<表名>` | GET | 获取全部数据（用于导出） |
| `/api/open-file-dialog` | POST | 打开原生文件选择对话框 |
| `/api/open-file` | POST | 按路径打开指定 .db 文件 |

## 🛠️ 技术栈

- **前端**：React 18 + TypeScript + MUI 5 + Tailwind CSS
- **后端**：Node.js + better-sqlite3
- **构建**：Vite 5
- **测试**：Vitest

## 📄 许可证

MIT License — 详见 [LICENSE](LICENSE)。
