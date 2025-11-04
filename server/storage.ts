import {
  type User,
  type InsertUser,
  type TestSet,
  type InsertTestSet,
  type Question,
  type InsertQuestion,
  type Tip,
  type InsertTip,
  type Media,
  type InsertMedia,
  type Activity,
  type InsertActivity,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Test Set methods
  getAllTestSets(): Promise<TestSet[]>;
  getTestSet(id: string): Promise<TestSet | undefined>;
  createTestSet(testSet: InsertTestSet): Promise<TestSet>;
  updateTestSet(id: string, testSet: Partial<InsertTestSet>): Promise<TestSet | undefined>;
  deleteTestSet(id: string): Promise<boolean>;

  // Question methods
  getAllQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsBySkill(skill: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  // Tip methods
  getAllTips(): Promise<Tip[]>;
  getTip(id: string): Promise<Tip | undefined>;
  getTipsBySkill(skill: string): Promise<Tip[]>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: string, tip: Partial<InsertTip>): Promise<Tip | undefined>;
  deleteTip(id: string): Promise<boolean>;

  // Media methods
  getAllMedia(): Promise<Media[]>;
  getMedia(id: string): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  deleteMedia(id: string): Promise<boolean>;

  // Activity methods
  getAllActivities(): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Stats methods
  getStats(): Promise<{
    setsCount: number;
    questionsCount: number;
    tipsCount: number;
    mediaCount: number;
  }>;
  getQuestionDistribution(): Promise<{
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private testSets: Map<string, TestSet>;
  private questions: Map<string, Question>;
  private tips: Map<string, Tip>;
  private media: Map<string, Media>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.testSets = new Map();
    this.questions = new Map();
    this.tips = new Map();
    this.media = new Map();
    this.activities = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample users
    await this.createUser({
      username: "admin",
      password: "admin123",
      role: "admin",
    });

    await this.createUser({
      username: "student",
      password: "student123",
      role: "student",
    });

    // Create sample test sets
    const sampleSets = [
      { title: "APTIS Reading Test 1", skill: "Reading", questionCount: 25, status: "published" },
      { title: "APTIS Listening Practice", skill: "Listening", questionCount: 20, status: "published" },
      { title: "Speaking Skills Builder", skill: "Speaking", questionCount: 15, status: "draft" },
      { title: "Writing Essentials", skill: "Writing", questionCount: 10, status: "published" },
    ];

    for (const set of sampleSets) {
      await this.createTestSet(set);
    }

    // Create sample questions
    const sampleQuestions = [
      {
        title: "Reading Comprehension - Technology",
        skill: "Reading",
        type: "mcq_single",
        points: 1,
        tags: ["technology", "comprehension"],
        content: "What is the main idea of the passage?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswers: ["Option B"],
        mediaUrl: null,
        explanation: "The passage focuses on...",
      },
      {
        title: "Listening - Conversation at Airport",
        skill: "Listening",
        type: "mcq_single",
        points: 1,
        tags: ["conversation", "travel"],
        content: "Where is the speaker going?",
        options: ["London", "Paris", "Tokyo", "New York"],
        correctAnswers: ["Tokyo"],
        mediaUrl: "/audio/airport-conversation.mp3",
        explanation: null,
      },
      {
        title: "Speaking - Describe your hometown",
        skill: "Speaking",
        type: "speaking_prompt",
        points: 5,
        tags: ["description", "personal"],
        content: "Describe your hometown and explain what makes it special.",
        options: null,
        correctAnswers: null,
        mediaUrl: null,
        explanation: null,
      },
      {
        title: "Writing - Email to friend",
        skill: "Writing",
        type: "writing_prompt",
        points: 10,
        tags: ["email", "informal"],
        content: "Write an email to your friend about your recent vacation.",
        options: null,
        correctAnswers: null,
        mediaUrl: null,
        explanation: null,
      },
    ];

    for (const question of sampleQuestions) {
      await this.createQuestion(question);
    }

    // Create sample tips
    const sampleTips = [
      {
        title: "How to improve reading speed",
        skill: "Reading",
        content: "Practice skimming and scanning techniques. Focus on key words and main ideas first. Don't try to understand every single word.",
        status: "published",
      },
      {
        title: "Active listening techniques",
        skill: "Listening",
        content: "Take notes while listening. Focus on the speaker's tone and intonation. Try to predict what will come next.",
        status: "published",
      },
      {
        title: "Speaking fluently and confidently",
        skill: "Speaking",
        content: "Practice speaking daily. Record yourself. Don't worry about making mistakes. Focus on clear communication.",
        status: "published",
      },
      {
        title: "Writing structured essays",
        skill: "Writing",
        content: "Plan your essay before writing. Use topic sentences. Connect paragraphs with transition words.",
        status: "published",
      },
      {
        title: "General test-taking strategies",
        skill: "General",
        content: "Read all instructions carefully. Manage your time wisely. Review your answers before submitting.",
        status: "published",
      },
    ];

    for (const tip of sampleTips) {
      await this.createTip(tip);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "student"
    };
    this.users.set(id, user);
    return user;
  }

  // Test Set methods
  async getAllTestSets(): Promise<TestSet[]> {
    return Array.from(this.testSets.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    return this.testSets.get(id);
  }

  async createTestSet(insertTestSet: InsertTestSet): Promise<TestSet> {
    const id = randomUUID();
    const testSet: TestSet = {
      ...insertTestSet,
      id,
      questionCount: insertTestSet.questionCount ?? 0,
      status: insertTestSet.status || "draft",
      updatedAt: new Date(),
    };
    this.testSets.set(id, testSet);

    // Create activity
    await this.createActivity({
      action: "created",
      resourceType: "set",
      resourceTitle: testSet.title,
    });

    return testSet;
  }

  async updateTestSet(id: string, update: Partial<InsertTestSet>): Promise<TestSet | undefined> {
    const existing = this.testSets.get(id);
    if (!existing) return undefined;

    const updated: TestSet = {
      ...existing,
      ...update,
      updatedAt: new Date(),
    };
    this.testSets.set(id, updated);

    // Create activity
    await this.createActivity({
      action: "updated",
      resourceType: "set",
      resourceTitle: updated.title,
    });

    return updated;
  }

  async deleteTestSet(id: string): Promise<boolean> {
    const existing = this.testSets.get(id);
    if (!existing) return false;

    this.testSets.delete(id);

    // Create activity
    await this.createActivity({
      action: "deleted",
      resourceType: "set",
      resourceTitle: existing.title,
    });

    return true;
  }

  // Question methods
  async getAllQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsBySkill(skill: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter((q) => q.skill === skill);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id,
      points: insertQuestion.points ?? 1,
      tags: insertQuestion.tags ?? null,
      options: insertQuestion.options ?? null,
      correctAnswers: insertQuestion.correctAnswers ?? null,
      mediaUrl: insertQuestion.mediaUrl ?? null,
      explanation: insertQuestion.explanation ?? null,
    };
    this.questions.set(id, question);

    // Create activity
    await this.createActivity({
      action: "created",
      resourceType: "question",
      resourceTitle: question.title,
    });

    return question;
  }

  async updateQuestion(
    id: string,
    update: Partial<InsertQuestion>
  ): Promise<Question | undefined> {
    const existing = this.questions.get(id);
    if (!existing) return undefined;

    const updated: Question = { ...existing, ...update };
    this.questions.set(id, updated);

    // Create activity
    await this.createActivity({
      action: "updated",
      resourceType: "question",
      resourceTitle: updated.title,
    });

    return updated;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const existing = this.questions.get(id);
    if (!existing) return false;

    this.questions.delete(id);

    // Create activity
    await this.createActivity({
      action: "deleted",
      resourceType: "question",
      resourceTitle: existing.title,
    });

    return true;
  }

  // Tip methods
  async getAllTips(): Promise<Tip[]> {
    return Array.from(this.tips.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTip(id: string): Promise<Tip | undefined> {
    return this.tips.get(id);
  }

  async getTipsBySkill(skill: string): Promise<Tip[]> {
    return Array.from(this.tips.values()).filter((t) => t.skill === skill);
  }

  async createTip(insertTip: InsertTip): Promise<Tip> {
    const id = randomUUID();
    const tip: Tip = {
      ...insertTip,
      id,
      status: insertTip.status || "published",
      createdAt: new Date(),
    };
    this.tips.set(id, tip);

    // Create activity
    await this.createActivity({
      action: "created",
      resourceType: "tip",
      resourceTitle: tip.title,
    });

    return tip;
  }

  async updateTip(id: string, update: Partial<InsertTip>): Promise<Tip | undefined> {
    const existing = this.tips.get(id);
    if (!existing) return undefined;

    const updated: Tip = { ...existing, ...update };
    this.tips.set(id, updated);

    // Create activity
    await this.createActivity({
      action: "updated",
      resourceType: "tip",
      resourceTitle: updated.title,
    });

    return updated;
  }

  async deleteTip(id: string): Promise<boolean> {
    const existing = this.tips.get(id);
    if (!existing) return false;

    this.tips.delete(id);

    // Create activity
    await this.createActivity({
      action: "deleted",
      resourceType: "tip",
      resourceTitle: existing.title,
    });

    return true;
  }

  // Media methods
  async getAllMedia(): Promise<Media[]> {
    return Array.from(this.media.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getMedia(id: string): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = randomUUID();
    const mediaItem: Media = {
      ...insertMedia,
      id,
      uploadedAt: new Date(),
    };
    this.media.set(id, mediaItem);

    // Create activity
    await this.createActivity({
      action: "created",
      resourceType: "media",
      resourceTitle: mediaItem.filename,
    });

    return mediaItem;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const existing = this.media.get(id);
    if (!existing) return false;

    this.media.delete(id);

    // Create activity
    await this.createActivity({
      action: "deleted",
      resourceType: "media",
      resourceTitle: existing.filename,
    });

    return true;
  }

  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    const all = await this.getAllActivities();
    return all.slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Stats methods
  async getStats(): Promise<{
    setsCount: number;
    questionsCount: number;
    tipsCount: number;
    mediaCount: number;
  }> {
    return {
      setsCount: this.testSets.size,
      questionsCount: this.questions.size,
      tipsCount: this.tips.size,
      mediaCount: this.media.size,
    };
  }

  async getQuestionDistribution(): Promise<{
    reading: number;
    listening: number;
    speaking: number;
    writing: number;
  }> {
    const questions = Array.from(this.questions.values());
    return {
      reading: questions.filter((q) => q.skill === "Reading").length,
      listening: questions.filter((q) => q.skill === "Listening").length,
      speaking: questions.filter((q) => q.skill === "Speaking").length,
      writing: questions.filter((q) => q.skill === "Writing").length,
    };
  }
}

export const storage = new MemStorage();
