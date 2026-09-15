import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import type { IUser } from "@/calendar/interfaces";

export type ScheduleBinding = {
  user: IUser;
  icsUrl: string;
};

type BindingRow = {
  user_id: string;
  user_name: string;
  picture_path: string | null;
  ics_url: string;
};

const databasePath = process.env.SCHEDULE_BINDINGS_DB_PATH ?? path.join(process.cwd(), ".data", "schedule-bindings.sqlite");
let database: Database.Database | undefined;

function getDatabase() {
  if (!database) {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    database = new Database(databasePath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS schedule_bindings (
        user_id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        picture_path TEXT,
        ics_url TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

  }

  return database;
}

export function saveScheduleBinding(binding: ScheduleBinding) {
  getDatabase()
    .prepare(
      `INSERT INTO schedule_bindings (user_id, user_name, picture_path, ics_url, updated_at)
       VALUES (@userId, @userName, @picturePath, @icsUrl, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         user_name = excluded.user_name,
         picture_path = excluded.picture_path,
         ics_url = excluded.ics_url,
         updated_at = excluded.updated_at`,
    )
    .run({
      userId: binding.user.id,
      userName: binding.user.name,
      picturePath: binding.user.picturePath,
      icsUrl: binding.icsUrl,
    });
}

export function getScheduleBindings(): ScheduleBinding[] {
  const rows = getDatabase().prepare("SELECT user_id, user_name, picture_path, ics_url FROM schedule_bindings").all() as BindingRow[];

  return rows.map(row => ({
    user: {
      id: row.user_id,
      name: row.user_name,
      picturePath: row.picture_path,
    },
    icsUrl: row.ics_url,
  }));
}