import { ColumnInfo } from './database';

/** 生成表结构的 Markdown 文本 */
export function generateSchemaMarkdown(
  tableName: string,
  columns: ColumnInfo[]
): string {
  const lines: string[] = [];
  lines.push(`# 表名: ${tableName}`);
  lines.push('');
  lines.push('| 字段名 | 类型 | 主键 | 允许NULL | 默认值 |');
  lines.push('|--------|------|------|----------|--------|');

  for (const col of columns) {
    const pk = col.pk ? '✓' : '-';
    const nullable = col.notnull ? 'NO' : 'YES';
    const defaultVal = col.dflt_value === null ? '-' : col.dflt_value;
    lines.push(`| ${col.name} | ${col.type} | ${pk} | ${nullable} | ${defaultVal} |`);
  }

  return lines.join('\n');
}

/** 生成表数据的 Markdown 文本 */
export function generateDataMarkdown(
  tableName: string,
  columns: string[],
  rows: string[][]
): string {
  const lines: string[] = [];
  lines.push(`# 表名: ${tableName} (数据)`);
  lines.push('');

  // 表头
  lines.push(`| ${columns.join(' | ')} |`);
  lines.push(`| ${columns.map(() => '----').join(' | ')} |`);

  // 数据行
  for (const row of rows) {
    lines.push(`| ${row.join(' | ')} |`);
  }

  return lines.join('\n');
}

/** 复制文本到剪贴板 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** 下载文本为文件（Web 模式使用） */
export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
