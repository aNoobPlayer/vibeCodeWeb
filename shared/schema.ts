import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Test Sets
export const testSets = pgTable("test_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  skill: text("skill").notNull(), // Reading, Listening, Speaking, Writing, GrammarVocabulary
  questionCount: integer("question_count").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft, published
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  timeLimit: integer("time_limit").default(60),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTestSetSchema = createInsertSchema(testSets).omit({
  id: true,
  updatedAt: true,
});

export type InsertTestSet = z.infer<typeof insertTestSetSchema>;
export type TestSet = typeof testSets.$inferSelect;

// Questions
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  skill: text("skill").notNull(), // Reading, Listening, Speaking, Writing
  type: text("type").notNull(), // mcq_single, mcq_multi, fill_blank, writing_prompt, speaking_prompt
  points: integer("points").notNull().default(1),
  tags: text("tags").array(),
  content: text("content").notNull(), // Question content/prompt
  options: text("options").array(), // For MCQ questions
  correctAnswers: text("correct_answers").array(), // For MCQ/fill_blank
  mediaUrl: text("media_url"), // Optional audio/image URL
  explanation: text("explanation"), // Optional explanation
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// Tips & Guides
export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  skill: text("skill").notNull(), // Reading, Listening, Speaking, Writing, GrammarVocabulary, General
  content: text("content").notNull(),
  status: text("status").notNull().default("published"), // draft, published
  priority: text("priority").default("medium"), // high, medium, low
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;

// Media Library
export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  type: text("type").notNull(), // audio, image
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertMediaSchema = createInsertSchema(media).omit({
  id: true,
  uploadedAt: true,
});

export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;

// Activity Logs (for dashboard)
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // created, updated, deleted
  resourceType: text("resource_type").notNull(), // set, question, tip, media
  resourceTitle: text("resource_title").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// User (keeping existing user schema)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // admin, student
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
