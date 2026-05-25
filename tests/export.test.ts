import { describe, it, expect } from 'vitest';
import { generateSchemaMarkdown, generateDataMarkdown } from '../src/utils/export';
import { ColumnInfo } from '../src/utils/database';

describe('generateSchemaMarkdown', () => {
  it('should generate correct markdown for a table with columns', () => {
    const columns: ColumnInfo[] = [
      { cid: 0, name: 'id', type: 'INTEGER', notnull: true, dflt_value: null, pk: true },
      { cid: 1, name: 'name', type: 'TEXT', notnull: true, dflt_value: null, pk: false },
      { cid: 2, name: 'email', type: 'TEXT', notnull: false, dflt_value: null, pk: false },
      { cid: 3, name: 'age', type: 'INTEGER', notnull: false, dflt_value: '0', pk: false },
    ];

    const result = generateSchemaMarkdown('users', columns);

    // Check title
    expect(result).toContain('# 表名: users');

    // Check table header
    expect(result).toContain('| 字段名 | 类型 | 主键 | 允许NULL | 默认值 |');
    expect(result).toContain('|--------|------|------|----------|--------|');

    // Check id column (primary key)
    expect(result).toContain('| id | INTEGER | ✓ | NO | - |');

    // Check name column (not null)
    expect(result).toContain('| name | TEXT | - | NO | - |');

    // Check email column (nullable)
    expect(result).toContain('| email | TEXT | - | YES | - |');

    // Check age column (with default value)
    expect(result).toContain('| age | INTEGER | - | YES | 0 |');
  });

  it('should generate correct markdown for empty columns', () => {
    const result = generateSchemaMarkdown('empty_table', []);
    expect(result).toContain('# 表名: empty_table');
    expect(result).toContain('| 字段名 | 类型 | 主键 | 允许NULL | 默认值 |');
    // title, empty line, header, separator = 4 lines
    const lines = result.split('\n');
    expect(lines.length).toBe(4);
  });

  it('should handle primary key display correctly', () => {
    const columns: ColumnInfo[] = [
      { cid: 0, name: 'id', type: 'INTEGER', notnull: true, dflt_value: null, pk: true },
    ];
    const result = generateSchemaMarkdown('test', columns);
    expect(result).toContain('✓'); // pk checkmark
  });

  it('should display dash for non-primary-key', () => {
    const columns: ColumnInfo[] = [
      { cid: 0, name: 'value', type: 'REAL', notnull: false, dflt_value: null, pk: false },
    ];
    const result = generateSchemaMarkdown('test', columns);
    expect(result).toContain('| value | REAL | - | YES | - |');
  });

  it('should display YES for nullable and NO for not-null', () => {
    const columns: ColumnInfo[] = [
      { cid: 0, name: 'a', type: 'TEXT', notnull: true, dflt_value: null, pk: false },
      { cid: 1, name: 'b', type: 'TEXT', notnull: false, dflt_value: null, pk: false },
    ];
    const result = generateSchemaMarkdown('test', columns);
    expect(result).toContain('| a | TEXT | - | NO | - |');
    expect(result).toContain('| b | TEXT | - | YES | - |');
  });

  it('should display default value when present', () => {
    const columns: ColumnInfo[] = [
      { cid: 0, name: 'status', type: 'TEXT', notnull: false, dflt_value: "'active'", pk: false },
    ];
    const result = generateSchemaMarkdown('test', columns);
    expect(result).toContain("'active'");
  });
});

describe('generateDataMarkdown', () => {
  it('should generate correct markdown for table data', () => {
    const columns = ['id', 'name', 'age'];
    const rows = [
      ['1', 'Alice', '28'],
      ['2', 'Bob', '35'],
    ];

    const result = generateDataMarkdown('users', columns, rows);

    // Check title
    expect(result).toContain('# 表名: users (数据)');

    // Check header
    expect(result).toContain('| id | name | age |');
    expect(result).toContain('| ---- | ---- | ---- |');

    // Check data rows
    expect(result).toContain('| 1 | Alice | 28 |');
    expect(result).toContain('| 2 | Bob | 35 |');
  });

  it('should handle empty data', () => {
    const columns = ['id', 'name'];
    const rows: string[][] = [];

    const result = generateDataMarkdown('empty', columns, rows);

    expect(result).toContain('# 表名: empty (数据)');
    expect(result).toContain('| id | name |');
    // Should not contain any data rows
    const lines = result.split('\n');
    expect(lines.length).toBe(4); // title, empty line, header, separator
  });

  it('should handle NULL values in data', () => {
    const columns = ['id', 'email'];
    const rows = [['1', 'NULL']];

    const result = generateDataMarkdown('test', columns, rows);
    expect(result).toContain('| 1 | NULL |');
  });

  it('should handle single column data', () => {
    const columns = ['count'];
    const rows = [['42']];

    const result = generateDataMarkdown('test', columns, rows);
    expect(result).toContain('| count |');
    expect(result).toContain('| 42 |');
  });

  it('should handle many columns correctly', () => {
    const columns = ['a', 'b', 'c', 'd', 'e'];
    const rows = [['1', '2', '3', '4', '5']];

    const result = generateDataMarkdown('test', columns, rows);
    expect(result).toContain('| a | b | c | d | e |');
    expect(result).toContain('| 1 | 2 | 3 | 4 | 5 |');
  });
});
