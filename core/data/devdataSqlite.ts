import fs, { writeFileSync } from "fs";

import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { DatabaseConnection } from "../indexing/refreshIndex.js";

import { getDevDataFilePath, getDevDataSqlitePath } from "../util/paths.js";
import { LOCAL_DEV_DATA_VERSION } from "./log";

/* The Dev Data SQLITE table is only used for local tokens generated */
export class DevDataSqliteDb {
  static db: DatabaseConnection | null = null;

  private static async createTables(db: DatabaseConnection) {
    await db.exec(
      `CREATE TABLE IF NOT EXISTS tokens_generated (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model TEXT NOT NULL,
            provider TEXT NOT NULL,
            tokens_generated INTEGER NOT NULL,
            tokens_prompt INTEGER NOT NULL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    );

    // Add tokens_prompt column if it doesn't exist
    const columnCheckResult = await db.all(
      "PRAGMA table_info(tokens_generated);",
    );
    const columnExists = columnCheckResult.some(
      (col: any) => col.name === "tokens_prompt",
    );
    if (!columnExists) {
      await db.exec(
        "ALTER TABLE tokens_generated ADD COLUMN tokens_prompt INTEGER NOT NULL DEFAULT 0;",
      );
    }

    // 创建特性使用表，增加更多字段和索引
    await db.run(`
        CREATE TABLE IF NOT EXISTS feature_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          feature TEXT,
          count INTEGER DEFAULT 1,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(username, feature)
        )
      `);
    console.log('feature_usage table created or already exists');

    // 创建索引以提高查询性能
    await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_feature_usage_username ON feature_usage(username);
        CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature);
        CREATE INDEX IF NOT EXISTS idx_feature_usage_timestamp ON feature_usage(timestamp);
      `);
  }

  public static async logTokensGenerated(
    model: string,
    provider: string,
    promptTokens: number,
    generatedTokens: number,
  ) {
    const db = await DevDataSqliteDb.get();
    await db?.run(
      "INSERT INTO tokens_generated (model, provider, tokens_prompt, tokens_generated) VALUES (?, ?, ?, ?)",
      [model, provider, promptTokens, generatedTokens],
    );
  }

  public static async getTokensPerDay() {
    const db = await DevDataSqliteDb.get();
    const result = await db?.all(
      // Return a sum of tokens_generated and tokens_prompt columns aggregated by day
      `SELECT date(timestamp) as day, sum(tokens_prompt) as promptTokens, sum(tokens_generated) as generatedTokens
        FROM tokens_generated
        GROUP BY date(timestamp)`,
    );
    return result ?? [];
  }

  public static async getTokensPerModel() {
    const db = await DevDataSqliteDb.get();
    const result = await db?.all(
      // Return a sum of tokens_generated and tokens_prompt columns aggregated by model
      `SELECT model, sum(tokens_prompt) as promptTokens, sum(tokens_generated) as generatedTokens
        FROM tokens_generated
        GROUP BY model`,
    );
    return result ?? [];
  }

  private static async runQuery(db: DatabaseConnection, sql: string, params: any[]) {
    return new Promise((resolve, reject) => {
      try {
        db.run(sql, params)
          .then((result) => {
            resolve(result);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  public static async trackFeatureUsage(username: string, feature: string) {
    try {
      console.log('Tracking Feature Usage:', {
        username,
        feature,
        timestamp: new Date().toISOString()
      });
      console.log("---1--1-1-1-1-")
      try {
        try {
          // Insert into SQLite database
          const db = await DevDataSqliteDb.get();
          console.log("SQLite Database:", db ? "Connected" : "Not Connected");

          if (db) {
            try {
              // 使用封装的 Promise 执行 SQL 语句
              const result = await DevDataSqliteDb.runQuery(
                db,
                `INSERT INTO feature_usage (username, feature)
                 VALUES (?, ?) 
                 ON CONFLICT(username, feature) 
                 DO UPDATE SET
                    count = count + 1,
                    timestamp = CURRENT_TIMESTAMP`,
                [username, feature],
              );
              console.log("SQLite Insert Result:", result);
            } catch (error) {
              console.error("Error executing SQLite query:", error);
            }
          } else {
            console.error("Failed to get SQLite database connection");
          }
        } catch (error) {
          console.error("Error inserting feature usage into SQLite:", error);
        }

        try {
          const filepath: string = getDevDataFilePath('feature_usage' as any, LOCAL_DEV_DATA_VERSION);
          const jsonLine = JSON.stringify({
            username,
            feature,
            timestamp: new Date().toISOString()
          });
          writeFileSync(filepath, `${jsonLine}\n`, { flag: "a" });
          console.log('Data written to file:', filepath);
        } catch (fileError) {
          console.error('Error writing to file:', fileError);
        }

        console.log("logDevData executed successfully"); // 用于验证 logDevData 是否成功执行
      } catch (logError) {
        console.error('Error in logDevData:', logError);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds

        try {
          console.log("开始调用后端")
          const response = await fetch('http://20.5.192.166:8085/manage/ApiInsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username,
              feature,
              timestamp: new Date().toISOString()
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn('Failed to send feature usage to backend', response.statusText);
          }
        } catch (apiError) {
          clearTimeout(timeoutId);

          // More detailed error logging
          if (apiError instanceof DOMException && apiError.name === 'AbortError') {
            console.warn('Feature usage backend call timed out', {
              username,
              feature,
              timestamp: new Date().toISOString()
            });
          } else {
            console.warn('Error sending feature usage to backend:', apiError);
          }
        }
      } catch (unexpectedError) {
        console.warn('Unexpected error in feature usage tracking:', unexpectedError);
      }

      console.log('Feature usage logged successfully');
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  public static async getFeatureUsage() {
    console.group('DevDataSqliteDb: 获取特性使用情况');
    try {
      const db = await DevDataSqliteDb.get();
      console.log('获取到数据库连接');

      // Ensure tables are created
      await this.createTables(db);
      console.log('确保表已创建');

      console.log("开始查询feature_usage表");
      const result = await db.all(`
        SELECT 
          username, 
          feature, 
          sum(count) as usageCount
        FROM feature_usage
        GROUP BY username, feature
        ORDER BY usageCount DESC;
      `);
      
      console.log("查询结果:", result);
      console.log("记录数量:", result.length);
      return result;
    } catch (error) {
      console.error('获取特性使用情况时出错:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  static async get() {
    const devDataSqlitePath = getDevDataSqlitePath();
    if (DevDataSqliteDb.db && fs.existsSync(devDataSqlitePath)) {
      return DevDataSqliteDb.db;
    }

    DevDataSqliteDb.db = await open({
      filename: devDataSqlitePath,
      driver: sqlite3.Database,
    });

    await DevDataSqliteDb.db.exec("PRAGMA busy_timeout = 3000;");

    await DevDataSqliteDb.createTables(DevDataSqliteDb.db!);

    return DevDataSqliteDb.db;
  }
}
