import { boolean, integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const metrics = pgTable('metrics', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  lcp: integer().notNull(),
  commitSha: varchar({ length: 64 }).notNull(),
  pathname: text(),
  browserName: varchar({ length: 100 }),
  browserVersion: varchar({ length: 50 }),
  browserMajor: varchar({ length: 10 }),
  osName: varchar({ length: 100 }),
  osVersion: varchar({ length: 50 }),
  isBot: boolean().notNull().default(false),
  isAIAssistant: boolean().notNull().default(false),
  isAICrawler: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});
