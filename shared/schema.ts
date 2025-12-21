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

// Question Templates
export type QuestionTemplate = {
  id: string;
  label: string;
  description: string;
  skills: string[];
  types: Question["type"][];
  content: string;
  options?: string[];
  correctAnswers?: string[];
  tags?: string[];
  difficulty?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
};

export type InsertQuestionTemplate = Omit<QuestionTemplate, "id" | "createdAt" | "updatedAt">;

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

// Lessons
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  skill: text("skill").notNull(), // Reading, Listening, Speaking, Writing, GrammarVocabulary, General
  status: text("status").notNull().default("draft"), // draft, published
  content: text("content").notNull(),
  outcomes: text("outcomes").array(),
  keyPoints: text("key_points").array(),
  practicePrompts: text("practice_prompts").array(),
  testSetId: text("test_set_id"),
  courseId: text("course_id"),
  durationMinutes: integer("duration_minutes"),
  orderIndex: integer("order_index"),
  coverImageUrl: text("cover_image_url"),
  youtubeUrl: text("youtube_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Courses
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open, closed
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const courseMembers = pgTable("course_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("student"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const insertCourseMemberSchema = createInsertSchema(courseMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertCourseMember = z.infer<typeof insertCourseMemberSchema>;
export type CourseMember = typeof courseMembers.$inferSelect;

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
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
