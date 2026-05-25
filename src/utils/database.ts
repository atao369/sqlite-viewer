/** 列信息接口 */
export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: boolean;
  dflt_value: string | null;
  pk: boolean;
}

/** 分页数据接口 */
export interface PagedData {
  columns: string[];
  rows: string[][];
  totalRows: number;
  page: number;
  pageSize: number;
}

/** 检查是否运行在本地服务器模式（有 /api 端点） */
export function isServerMode(): boolean {
  // 通过检测 /api/health 端点来判断
  // 在构建时做静态判断：如果当前页面来自 localhost 且有后端 API
  return typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3456';
}

/**
 * 服务器模式数据库操作
 * 通过 HTTP API 调用本地 Node.js 后端 (better-sqlite3)
 */
export class ServerDatabase {
  private filePath: string;
  private _tables: string[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async init(): Promise<void> {
    const result = await this.api('/api/tables', { file: this.filePath });
    if (!result.success) throw new Error(result.error || '获取表列表失败');
    this._tables = result.data;
  }

  getTableNames(): string[] {
    return this._tables;
  }

  async getTableInfo(tableName: string): Promise<ColumnInfo[]> {
    const result = await this.api('/api/table-info', { file: this.filePath, table: tableName });
    if (!result.success) throw new Error(result.error || '获取表结构失败');
    return result.data.map((row: any) => ({
      cid: row.cid,
      name: row.name,
      type: row.type,
      notnull: row.notnull === 1,
      dflt_value: row.dflt_value,
      pk: row.pk > 0,
    }));
  }

  async getTableData(tableName: string, page: number = 1, pageSize: number = 50): Promise<PagedData> {
    const result = await this.api('/api/table-data', { file: this.filePath, table: tableName, page: String(page), pageSize: String(pageSize) });
    if (!result.success) throw new Error(result.error || '获取表数据失败');
    const { columns, rows, totalRows } = result.data;
    return {
      columns,
      rows: rows.map((row: any) => columns.map((col: string) => row[col] === null ? 'NULL' : String(row[col]))),
      totalRows,
      page,
      pageSize,
    };
  }

  async getAllTableData(tableName: string): Promise<{ columns: string[]; rows: string[][] }> {
    const result = await this.api('/api/all-table-data', { file: this.filePath, table: tableName });
    if (!result.success) throw new Error(result.error || '获取表数据失败');
    const { columns, rows } = result.data;
    return {
      columns,
      rows: rows.map((row: any) => columns.map((col: string) => row[col] === null ? 'NULL' : String(row[col]))),
    };
  }

  close(): void {
    // no-op for server mode
  }

  private async api(endpoint: string, params: Record<string, string>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${endpoint}?${query}`);
    return response.json();
  }
}

/**
 * Web 模式数据库操作
 * 使用 sql.js (WASM) 在浏览器端解析 .db 文件
 */
export class WebDatabase {
  private db: any = null;

  async loadFile(file: File): Promise<void> {
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
    });
    const buffer = await file.arrayBuffer();
    this.db = new SQL.Database(new Uint8Array(buffer));
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getTableNames(): string[] {
    if (!this.db) return [];
    const result = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    if (result.length === 0) return [];
    return result[0].values.map((row: any[]) => row[0] as string);
  }

  getTableInfo(tableName: string): ColumnInfo[] {
    if (!this.db) return [];
    const result = this.db.exec(`PRAGMA table_info("${tableName}")`);
    if (result.length === 0) return [];
    return result[0].values.map((row: any[]) => ({
      cid: row[0] as number,
      name: row[1] as string,
      type: row[2] as string,
      notnull: (row[3] as number) === 1,
      dflt_value: row[4] as string | null,
      pk: (row[5] as number) > 0,
    }));
  }

  getTableData(tableName: string, page: number = 1, pageSize: number = 50): PagedData {
    if (!this.db) return { columns: [], rows: [], totalRows: 0, page, pageSize };
    const countResult = this.db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
    const totalRows = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;
    const offset = (page - 1) * pageSize;
    const dataResult = this.db.exec(`SELECT * FROM "${tableName}" LIMIT ${pageSize} OFFSET ${offset}`);
    if (dataResult.length === 0) return { columns: [], rows: [], totalRows, page, pageSize };
    const columns = dataResult[0].columns;
    const rows = dataResult[0].values.map((row: any[]) =>
      row.map((val: any) => (val === null ? 'NULL' : String(val)))
    );
    return { columns, rows, totalRows, page, pageSize };
  }

  getAllTableData(tableName: string): { columns: string[]; rows: string[][] } {
    if (!this.db) return { columns: [], rows: [] };
    const result = this.db.exec(`SELECT * FROM "${tableName}"`);
    if (result.length === 0) return { columns: [], rows: [] };
    const columns = result[0].columns;
    const rows = result[0].values.map((row: any[]) =>
      row.map((val: any) => (val === null ? 'NULL' : String(val)))
    );
    return { columns, rows };
  }
}

/** 统一的数据库接口类型 */
export type SQLiteDatabase = ServerDatabase | WebDatabase;
