/**
 * SQLite 数据库浏览器 - 本地服务端
 * 使用 better-sqlite3 原生模块直接读取 .db 文件
 * 自动启动浏览器访问
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');
const { execSync } = require('child_process');

const PORT = 3456;
const DIST_DIR = path.join(__dirname, 'dist');

/** MIME 类型映射 */
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** 打开的数据库连接缓存 */
const dbCache = new Map();

/** 获取数据库连接（只读模式） */
function getDb(filePath) {
  // 规范化路径
  const normalized = path.resolve(filePath);

  if (dbCache.has(normalized)) {
    return dbCache.get(normalized);
  }

  const Database = require('better-sqlite3');
  const db = new Database(normalized, { readonly: true });
  dbCache.set(normalized, db);
  return db;
}

/** 关闭所有数据库连接 */
function closeAllDbs() {
  for (const [filePath, db] of dbCache) {
    try { db.close(); } catch {}
  }
  dbCache.clear();
}

/** API 路由处理 */
function handleApi(req, res, pathname, query) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const filePath = query.file;

    // 获取表列表
    if (pathname === '/api/tables' && filePath) {
      const db = getDb(filePath);
      const rows = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all();
      res.end(JSON.stringify({ success: true, data: rows.map(r => r.name) }));
      return;
    }

    // 获取表结构
    if (pathname === '/api/table-info' && filePath && query.table) {
      const db = getDb(filePath);
      const rows = db.prepare(`PRAGMA table_info("${query.table}")`).all();
      res.end(JSON.stringify({ success: true, data: rows }));
      return;
    }

    // 获取表数据（分页）
    if (pathname === '/api/table-data' && filePath && query.table) {
      const db = getDb(filePath);
      const tableName = query.table;
      const page = parseInt(query.page || '1', 10);
      const pageSize = parseInt(query.pageSize || '50', 10);

      const countRow = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
      const totalRows = countRow.count;
      const offset = (page - 1) * pageSize;
      const rows = db.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(pageSize, offset);
      const stmt = db.prepare(`SELECT * FROM "${tableName}" LIMIT 0`);
      const columns = stmt.columns().map(c => c.name);

      res.end(JSON.stringify({ success: true, data: { columns, rows, totalRows, page, pageSize } }));
      return;
    }

    // 获取全部表数据（导出用）
    if (pathname === '/api/all-table-data' && filePath && query.table) {
      const db = getDb(filePath);
      const rows = db.prepare(`SELECT * FROM "${query.table}"`).all();
      const stmt = db.prepare(`SELECT * FROM "${query.table}" LIMIT 0`);
      const columns = stmt.columns().map(c => c.name);
      res.end(JSON.stringify({ success: true, data: { columns, rows } }));
      return;
    }

    // 选择文件（返回文件路径确认）
    if (pathname === '/api/open-file') {
      // 客户端模式直接传入路径
      if (filePath && fs.existsSync(filePath)) {
        res.end(JSON.stringify({ success: true, filePath: path.resolve(filePath) }));
      } else {
        res.end(JSON.stringify({ success: false, error: '文件不存在: ' + filePath }));
      }
      return;
    }

    // 弹出系统文件选择对话框
    if (pathname === '/api/open-file-dialog') {
      openFileDialog().then(result => {
        res.end(JSON.stringify(result));
      }).catch(err => {
        res.end(JSON.stringify({ success: false, error: err.message, canceled: true }));
      });
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'API not found' }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

/** 弹出系统文件选择对话框 */
function openFileDialog() {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // Windows: 写临时 .ps1 脚本文件执行，避免命令行引号转义问题
      const psScript = [
        'Add-Type -AssemblyName System.Windows.Forms',
        '$d = New-Object System.Windows.Forms.OpenFileDialog',
        '$d.Filter = "SQLite|*.db;*.sqlite;*.sqlite3|All|*.*"',
        '$d.Title = "Select SQLite Database"',
        'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {',
        '  Write-Output $d.FileName',
        '} else {',
        '  Write-Output ""',
        '}',
      ].join('\r\n');
      const tmpFile = path.join(require('os').tmpdir(), 'sqlite-viewer-dialog-' + Date.now() + '.ps1');
      try {
        fs.writeFileSync(tmpFile, psScript, 'ascii');
        const result = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, {
          timeout: 120000,
          windowsHide: true,
        }).toString().trim();
        // 清理临时文件
        try { fs.unlinkSync(tmpFile); } catch {}
        if (result) {
          resolve({ success: true, filePath: result, canceled: false });
        } else {
          resolve({ success: false, canceled: true });
        }
      } catch (err) {
        // 清理临时文件
        try { fs.unlinkSync(tmpFile); } catch {}
        // 用户取消或超时
        resolve({ success: false, canceled: true });
      }
    } else if (process.platform === 'darwin') {
      // macOS: 使用 osascript
      try {
        const result = execSync(
          `osascript -e 'POSIX path of (choose file of type {"db", "sqlite", "sqlite3"} with prompt "选择 SQLite 数据库文件")'`,
          { timeout: 120000 }
        ).toString().trim();
        resolve({ success: true, filePath: result, canceled: false });
      } catch (err) {
        resolve({ success: false, canceled: true });
      }
    } else {
      // Linux: 尝试 zenity
      try {
        const result = execSync(
          `zenity --file-selection --title="选择 SQLite 数据库文件" --file-filter="SQLite 数据库 | *.db *.sqlite *.sqlite3"`,
          { timeout: 120000 }
        ).toString().trim();
        resolve({ success: true, filePath: result, canceled: false });
      } catch (err) {
        resolve({ success: false, canceled: true });
      }
    }
  });
}

/** 静态文件服务 */
function serveStatic(req, res, pathname) {
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType + '; charset=utf-8');
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end('Not Found');
  }
}

/** 创建 HTTP 服务器 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname, query);
  } else {
    serveStatic(req, res, pathname);
  }
});

// 优雅退出
process.on('SIGINT', () => {
  closeAllDbs();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeAllDbs();
  server.close();
  process.exit(0);
});

// 启动服务器
server.listen(PORT, () => {
  const address = `http://localhost:${PORT}`;
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    SQLite 数据库浏览器 已启动        ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  地址: ${address}          ║`);
  console.log('║  按 Ctrl+C 退出                      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  // 自动打开浏览器
  const cmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} ${address}`, (err) => {
    if (err) console.log('请手动打开浏览器访问:', address);
  });
});
