import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Tests for SQLiteDatabase class core logic.
 *
 * Since SQLiteDatabase.loadFile() requires a browser File object and
 * sql.js WASM initialization with locateFile, we test the core database
 * operations directly using sql.js in Node.js environment, simulating
 * the same operations that SQLiteDatabase performs.
 */

let SQL: initSqlJs.SqlJsStatic;
let db: initSqlJs.Database;
const DB_PATH = path.resolve(__dirname, '../test_database.db');

/** Extract values from query result (mirrors database.ts extractValues) */
function extractValues(result: initSqlJs.QueryExecResult[]): string[][] {
  if (result.length === 0) return [];
  return result[0].values.map((row) =>
    row.map((val) => (val === null ? 'NULL' : String(val)))
  );
}

beforeAll(async () => {
  SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(new Uint8Array(buffer));
});

afterAll(() => {
  if (db) db.close();
});

describe('Database Loading', () => {
  it('should load test database file successfully', () => {
    expect(db).not.toBeNull();
  });

  it('should have valid buffer from db file', () => {
    const buffer = fs.readFileSync(DB_PATH);
    expect(buffer.length).toBeGreaterThan(0);
    // SQLite files start with "SQLite format 3"
    const header = buffer.toString('utf8', 0, 16);
    expect(header.startsWith('SQLite format 3')).toBe(true);
  });
});

describe('Get Table Names', () => {
  it('should return all user tables', () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tables = result[0].values.map((row) => row[0] as string);
    expect(tables).toContain('users');
    expect(tables).toContain('orders');
    expect(tables.length).toBe(2);
  });

  it('should not return internal sqlite tables', () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tables = result[0].values.map((row) => row[0] as string);
    for (const t of tables) {
      expect(t.startsWith('sqlite_')).toBe(false);
    }
  });

  it('should return tables in alphabetical order', () => {
    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    const tables = result[0].values.map((row) => row[0] as string);
    expect(tables).toEqual(['orders', 'users']);
  });
});

describe('Get Table Info (Schema)', () => {
  it('should return correct column info for users table', () => {
    const result = db.exec('PRAGMA table_info("users")');
    expect(result.length).toBe(1);

    const columns = result[0].values.map((row) => ({
      cid: row[0] as number,
      name: row[1] as string,
      type: row[2] as string,
      notnull: (row[3] as number) === 1,
      dflt_value: row[4] as string | null,
      pk: (row[5] as number) > 0,
    }));

    expect(columns.length).toBe(4);

    // id column (INTEGER PRIMARY KEY is ROWID alias in SQLite, PRAGMA returns notnull=0)
    expect(columns[0].name).toBe('id');
    expect(columns[0].type).toBe('INTEGER');
    expect(columns[0].pk).toBe(true);
    // SQLite treats INTEGER PRIMARY KEY as ROWID alias, notnull is 0 per PRAGMA
    expect(columns[0].notnull).toBe(false);

    // name column
    expect(columns[1].name).toBe('name');
    expect(columns[1].type).toBe('TEXT');
    expect(columns[1].notnull).toBe(true);
    expect(columns[1].pk).toBe(false);

    // email column
    expect(columns[2].name).toBe('email');
    expect(columns[2].type).toBe('TEXT');
    expect(columns[2].notnull).toBe(false);

    // age column
    expect(columns[3].name).toBe('age');
    expect(columns[3].type).toBe('INTEGER');
    expect(columns[3].dflt_value).toBe('0');
  });

  it('should return correct column info for orders table', () => {
    const result = db.exec('PRAGMA table_info("orders")');
    const columns = result[0].values.map((row) => ({
      cid: row[0] as number,
      name: row[1] as string,
      type: row[2] as string,
      notnull: (row[3] as number) === 1,
      dflt_value: row[4] as string | null,
      pk: (row[5] as number) > 0,
    }));

    expect(columns.length).toBe(4);
    expect(columns[0].name).toBe('id');
    expect(columns[0].pk).toBe(true);
    expect(columns[1].name).toBe('user_id');
    expect(columns[2].name).toBe('amount');
    expect(columns[2].type).toBe('REAL');
    expect(columns[3].name).toBe('created_at');
    expect(columns[3].type).toBe('TEXT');
  });

  it('should return empty result for non-existent table', () => {
    const result = db.exec('PRAGMA table_info("nonexistent")');
    expect(result.length).toBe(0);
  });
});

describe('Get Table Data', () => {
  it('should return all data from users table', () => {
    const result = db.exec('SELECT * FROM "users"');
    expect(result.length).toBe(1);
    expect(result[0].columns).toEqual(['id', 'name', 'email', 'age']);
    expect(result[0].values.length).toBe(8);
  });

  it('should return all data from orders table', () => {
    const result = db.exec('SELECT * FROM "orders"');
    expect(result.length).toBe(1);
    expect(result[0].columns).toEqual(['id', 'user_id', 'amount', 'created_at']);
    expect(result[0].values.length).toBe(10);
  });

  it('should handle NULL values correctly via extractValues', () => {
    const result = db.exec('SELECT * FROM "users" WHERE name = "Charlie"');
    const rows = extractValues(result);
    // Charlie has NULL email
    expect(rows[0][2]).toBe('NULL');
  });

  it('should handle NULL user_id in orders', () => {
    const result = db.exec('SELECT * FROM "orders" WHERE user_id IS NULL');
    const rows = extractValues(result);
    expect(rows.length).toBe(1);
    expect(rows[0][1]).toBe('NULL'); // user_id is NULL for order id=6
  });

  it('should support pagination with LIMIT and OFFSET', () => {
    // Page 1, pageSize 3
    const page1 = db.exec('SELECT * FROM "users" LIMIT 3 OFFSET 0');
    expect(page1[0].values.length).toBe(3);

    // Page 2, pageSize 3
    const page2 = db.exec('SELECT * FROM "users" LIMIT 3 OFFSET 3');
    expect(page2[0].values.length).toBe(3);

    // Page 3, pageSize 3 (only 2 remaining)
    const page3 = db.exec('SELECT * FROM "users" LIMIT 3 OFFSET 6');
    expect(page3[0].values.length).toBe(2);
  });

  it('should count total rows correctly', () => {
    const countResult = db.exec('SELECT COUNT(*) FROM "users"');
    const totalRows = countResult[0].values[0][0] as number;
    expect(totalRows).toBe(8);

    const countResult2 = db.exec('SELECT COUNT(*) FROM "orders"');
    const totalRows2 = countResult2[0].values[0][0] as number;
    expect(totalRows2).toBe(10);
  });

  it('should return REAL values as numbers', () => {
    const result = db.exec('SELECT amount FROM "orders" WHERE id = 1');
    const amount = result[0].values[0][0];
    expect(amount).toBe(99.99);
  });

  it('should throw error for non-existent table query', () => {
    // sql.js throws error when querying non-existent table
    expect(() => db.exec('SELECT * FROM "nonexistent"')).toThrow();
  });
});

describe('extractValues function', () => {
  it('should convert null to "NULL" string', () => {
    const result = db.exec('SELECT NULL as val');
    const rows = extractValues(result);
    expect(rows[0][0]).toBe('NULL');
  });

  it('should convert numbers to strings', () => {
    const result = db.exec('SELECT 42 as val');
    const rows = extractValues(result);
    expect(rows[0][0]).toBe('42');
  });

  it('should keep strings as strings', () => {
    const result = db.exec('SELECT "hello" as val');
    const rows = extractValues(result);
    expect(rows[0][0]).toBe('hello');
  });

  it('should handle empty result set', () => {
    const rows = extractValues([]);
    expect(rows).toEqual([]);
  });
});
