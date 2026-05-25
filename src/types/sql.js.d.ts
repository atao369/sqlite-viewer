declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  interface Database {
    exec(sql: string): QueryExecResult[];
    close(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export type { Database, QueryExecResult, SqlJsStatic };

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}

/** Electron API 类型声明 */
interface ElectronAPI {
  openFileDialog: () => Promise<string | null>;
  onFileOpened: (callback: (filePath: string) => void) => void;
  readDbFile: (filePath: string) => Promise<ArrayBuffer | { error: string }>;
  getTables: (filePath: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  getTableInfo: (filePath: string, tableName: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
  getTableData: (filePath: string, tableName: string, page: number, pageSize: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  getAllTableData: (filePath: string, tableName: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  saveMarkdownFile: (content: string, defaultName: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  isElectron: boolean;
}

interface Window {
  electronAPI?: ElectronAPI;
}
