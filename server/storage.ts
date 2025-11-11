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
  type QuestionTemplate,
  type InsertQuestionTemplate,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { query } from "./db";

const DEFAULT_TEMPLATE_SEEDS: InsertQuestionTemplate[] = [
  {
    label: "Single sentence gap-fill",
    description: "Learners supply one word to complete the sentence.",
    skills: ["Reading"],
    types: ["fill_blank"],
    content:
      `Complete the sentence with ONE word.\n\n` +
      `"Studying online has completely ___ the way students access information."`,
    correctAnswers: ["changed"],
  },
  {
    label: "Short paragraph with two blanks",
    description: "Two blanks focusing on vocabulary and grammar.",
    skills: ["Reading"],
    types: ["fill_blank"],
    content:
      `Fill in the TWO blanks with the correct words.\n\n` +
      `"During the interview, Minh stayed ___ even when the questions became ___."`,
    correctAnswers: ["calm", "difficult"],
  },
  {
    label: "Writing - informal email",
    description: "Prompt for a friendly email (120-150 words).",
    skills: ["Writing"],
    types: ["writing_prompt"],
    content:
      `You recently spent a weekend at your friend's house in Da Nang.\n` +
      `Write an email to thank them. Include:\n` +
      `- what you enjoyed most\n` +
      `- something funny that happened\n` +
      `- an invitation for them to visit you soon\n\n` +
      `Write 120-150 words.`,
  },
  {
    label: "Writing - opinion essay",
    description: "Structured opinion piece with reasons and examples.",
    skills: ["Writing"],
    types: ["writing_prompt"],
    content:
      `Many people believe that teenagers should have a part-time job while studying.\n` +
      `Do you agree or disagree?\n\n` +
      `Write an essay explaining your opinion. Include:\n` +
      `- at least two reasons for your view\n` +
      `- examples or experiences to support each reason\n` +
      `- a short conclusion with a recommendation\n\n` +
      `Write 180-220 words.`,
  },
  {
    label: "Reading - identify the writer's purpose",
    description: "Short email that checks overall understanding of why it was written.",
    skills: ["Reading"],
    types: ["mcq_single"],
    content:
      `Read the email and choose the best answer.\n\n` +
      `Email:\n` +
      `"Hi team,\n` +
      `Thanks for staying late this week. On Friday we will finish the app demo and I will order dinner for everyone.\n` +
      `Please send me your food preferences by tomorrow afternoon.\n` +
      `- Linh"\n\n` +
      `What is the main purpose of the email?`,
    options: [
      "A. To apologize for a late project",
      "B. To invite the team to a weekend trip",
      "C. To thank the team and collect dinner orders",
      "D. To cancel the demo presentation",
    ],
    correctAnswers: ["C. To thank the team and collect dinner orders"],
  },
  {
    label: "Listening - transport announcement",
    description: "Use with an uploaded audio clip; focuses on gist and key fact.",
    skills: ["Listening"],
    types: ["mcq_single"],
    content:
      `Listen to the station announcement (attach the audio via the media picker).\n` +
      `Question: Why is Train 82 delayed?\n` +
      `Choose ONE answer.`,
    options: [
      "A. The driver has not arrived",
      "B. The weather has damaged the tracks",
      "C. Maintenance crews are checking a signal problem",
      "D. There are too many passengers boarding",
    ],
    correctAnswers: ["C. Maintenance crews are checking a signal problem"],
  },
];

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

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

  // Template methods
  getAllTemplates(): Promise<QuestionTemplate[]>;
  createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate>;
  updateTemplate(id: string, template: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
  resetTemplates(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private testSets: Map<string, TestSet>;
  private questions: Map<string, Question>;
  private tips: Map<string, Tip>;
  private media: Map<string, Media>;
  private activities: Map<string, Activity>;
  private templates: Map<string, QuestionTemplate>;

  constructor() {
    this.users = new Map();
    this.testSets = new Map();
    this.questions = new Map();
    this.tips = new Map();
    this.media = new Map();
    this.activities = new Map();
    this.templates = new Map();

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

    for (const template of DEFAULT_TEMPLATE_SEEDS) {
      await this.createTemplate(template);
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
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "student",
      avatar: insertUser.avatar ?? null,
      isActive: insertUser.isActive ?? true,
      createdAt: now,
      lastLogin: null,
    } as User;
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateUser(id: string, update: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated: User = {
      ...existing,
      ...update,
      role: update.role ?? existing.role,
      avatar: update.avatar ?? existing.avatar,
      isActive: update.isActive ?? existing.isActive,
      lastLogin: existing.lastLogin,
    } as User;

    if (!update.password) {
      updated.password = existing.password;
    }

    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
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
      description: insertTestSet.description ?? null,
      questionCount: insertTestSet.questionCount ?? 0,
      status: insertTestSet.status || "draft",
      difficulty: insertTestSet.difficulty ?? null,
      timeLimit: insertTestSet.timeLimit ?? null,
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
      priority: insertTip.priority ?? null,
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

  // Template methods
  async getAllTemplates(): Promise<QuestionTemplate[]> {
    return Array.from(this.templates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const id = randomUUID();
    const now = new Date();
    const record: QuestionTemplate = {
      id,
      label: template.label,
      description: template.description,
      skills: template.skills ?? [],
      types: template.types ?? [],
      content: template.content,
      options: template.options ?? [],
      correctAnswers: template.correctAnswers ?? [],
      tags: template.tags ?? [],
      difficulty: template.difficulty ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(id, record);
    return record;
  }

  async updateTemplate(id: string, template: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    const updated: QuestionTemplate = {
      ...existing,
      ...template,
      skills: template.skills ?? existing.skills,
      types: template.types ?? existing.types,
      options: template.options ?? existing.options,
      correctAnswers: template.correctAnswers ?? existing.correctAnswers,
      tags: template.tags ?? existing.tags,
      difficulty: template.difficulty ?? existing.difficulty,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  async resetTemplates(): Promise<void> {
    this.templates.clear();
    for (const template of DEFAULT_TEMPLATE_SEEDS) {
      await this.createTemplate(template);
    }
  }
}

class SqlStorage implements IStorage {
  // Users
  async getUser(id: string) {
    const idNum = parseInt(id, 10);
    const result = await query(
      `SELECT id, email, passwordHash, role, avatar, isActive, createdAt, lastLogin FROM dbo.aptis_users WHERE id = @p0`,
      [idNum]
    );
    const row = result.recordset?.[0];
    if (!row) return undefined;
    return {
      id: String(row.id),
      username: row.email,
      password: row.passwordHash,
      role: row.role ?? "student",
      avatar: row.avatar ?? null,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? new Date(),
      lastLogin: row.lastLogin ?? null,
    } as User;
  }

  async getUserByUsername(username: string) {
    const result = await query(
      `SELECT TOP 1 id, email, passwordHash, role, avatar, isActive, createdAt, lastLogin FROM dbo.aptis_users WHERE email = @p0 OR name = @p0`,
      [username]
    );
    const row = result.recordset?.[0];
    if (!row) return undefined;
    return {
      id: String(row.id),
      username: row.email,
      password: row.passwordHash,
      role: row.role ?? "student",
      avatar: row.avatar ?? null,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? new Date(),
      lastLogin: row.lastLogin ?? null,
    } as User;
  }

  async createUser(insertUser: InsertUser) {
    const email = insertUser.username;
    const name = insertUser.username;
    const role = insertUser.role ?? "student";
    const passwordHash = insertUser.password; // NOTE: plaintext for now; replace with hash later.
    const result = await query(
      `INSERT INTO dbo.aptis_users(email, passwordHash, name, role)
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.passwordHash, INSERTED.role, INSERTED.avatar, INSERTED.isActive, INSERTED.createdAt, INSERTED.lastLogin
       VALUES(@p0, @p1, @p2, @p3)`,
      [email, passwordHash, name, role]
    );
    const row = result.recordset[0];
    return {
      id: String(row.id),
      username: row.email,
      password: row.passwordHash,
      role: row.role ?? "student",
      avatar: row.avatar ?? null,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? new Date(),
      lastLogin: row.lastLogin ?? null,
    } as User;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await query(
      `SELECT id, email, passwordHash, role, avatar, isActive, createdAt, lastLogin FROM dbo.aptis_users ORDER BY createdAt DESC`
    );
    return (result.recordset || []).map((row: any) => ({
      id: String(row.id),
      username: row.email,
      password: row.passwordHash,
      role: row.role ?? "student",
      avatar: row.avatar ?? null,
      isActive: row.isActive ?? true,
      createdAt: row.createdAt ?? new Date(),
      lastLogin: row.lastLogin ?? null,
    } as User));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const idNum = parseInt(id, 10);
    const fields: string[] = [];
    const params: any[] = [];

    if (user.username !== undefined) {
      fields.push(`email = @p${params.length}`);
      params.push(user.username);
      fields.push(`name = @p${params.length}`);
      params.push(user.username);
    }
    if (user.password !== undefined) {
      fields.push(`passwordHash = @p${params.length}`);
      params.push(user.password);
    }
    if (user.role !== undefined) {
      fields.push(`role = @p${params.length}`);
      params.push(user.role);
    }
    if (user.avatar !== undefined) {
      fields.push(`avatar = @p${params.length}`);
      params.push(user.avatar);
    }
    if (user.isActive !== undefined) {
      fields.push(`isActive = @p${params.length}`);
      params.push(user.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.getUser(id);
    }

    const setClause = fields.join(', ');
    await query(`UPDATE dbo.aptis_users SET ${setClause} WHERE id = @p${params.length}`, [...params, idNum]);
    return this.getUser(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    const result = await query(`DELETE FROM dbo.aptis_users WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  // Test Sets
  async getAllTestSets(): Promise<TestSet[]> {
    const result = await query(`
      SELECT s.id, s.name, s.[description], s.[status], s.timeLimit, s.level, s.skill, s.createdAt,
             (SELECT COUNT(*) FROM dbo.aptis_set_questions sq WHERE sq.setId = s.id) AS questionCount
      FROM dbo.aptis_sets s
      ORDER BY s.createdAt DESC
    `);
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      title: r.name,
      description: r.description ?? null,
      skill: r.skill ?? 'General',
      questionCount: r.questionCount ?? 0,
      status: r.status ?? 'published',
      difficulty: r.level ?? 'medium',
      timeLimit: r.timeLimit ?? 60,
      updatedAt: r.createdAt ?? new Date().toISOString(),
    } as TestSet));
  }

  async getTestSet(id: string): Promise<TestSet | undefined> {
    const idNum = parseInt(id, 10);
    const result = await query(
      `SELECT s.id, s.name, s.[description], s.[status], s.timeLimit, s.level, s.skill, s.createdAt,
              (SELECT COUNT(*) FROM dbo.aptis_set_questions sq WHERE sq.setId = s.id) AS questionCount
       FROM dbo.aptis_sets s WHERE s.id = @p0`,
      [idNum]
    );
    const r = result.recordset?.[0];
    if (!r) return undefined;
    return {
      id: String(r.id),
      title: r.name,
      description: r.description ?? null,
      skill: r.skill ?? 'General',
      questionCount: r.questionCount ?? 0,
      status: r.status ?? 'published',
      difficulty: r.level ?? 'medium',
      timeLimit: r.timeLimit ?? 60,
      updatedAt: r.createdAt ?? new Date().toISOString(),
    } as TestSet;
  }

  async createTestSet(insertTestSet: InsertTestSet): Promise<TestSet> {
    const result = await query(
      `INSERT INTO dbo.aptis_sets(name, [description], [status], timeLimit, level, skill)
       OUTPUT INSERTED.id, INSERTED.name, INSERTED.[description], INSERTED.[status], INSERTED.timeLimit, INSERTED.level, INSERTED.skill, INSERTED.createdAt
       VALUES(@p0, @p1, @p2, @p3, @p4, @p5)`,
      [
        insertTestSet.title,
        insertTestSet.description ?? null,
        insertTestSet.status ?? 'draft',
        insertTestSet.timeLimit ?? 60,
        insertTestSet.difficulty ?? 'medium',
        insertTestSet.skill ?? 'General',
      ]
    );
    const r = result.recordset[0];
    return {
      id: String(r.id),
      title: r.name,
      description: r.description ?? null,
      skill: r.skill ?? 'General',
      questionCount: 0,
      status: r.status ?? 'draft',
      difficulty: r.level ?? 'medium',
      timeLimit: r.timeLimit ?? 60,
      updatedAt: r.createdAt ?? new Date().toISOString(),
    } as TestSet;
  }

  async updateTestSet(id: string, testSet: Partial<InsertTestSet>): Promise<TestSet | undefined> {
    const idNum = parseInt(id, 10);
    // Build dynamic update
    const fields: string[] = [];
    const params: any[] = [];
    if (testSet.title !== undefined) { fields.push('name = @p' + params.length); params.push(testSet.title); }
    if (testSet.description !== undefined) { fields.push('[description] = @p' + params.length); params.push(testSet.description); }
    if (testSet.status !== undefined) { fields.push('[status] = @p' + params.length); params.push(testSet.status); }
    if (testSet.timeLimit !== undefined) { fields.push('timeLimit = @p' + params.length); params.push(testSet.timeLimit); }
    if (testSet.difficulty !== undefined) { fields.push('level = @p' + params.length); params.push(testSet.difficulty); }
    if (testSet.skill !== undefined) { fields.push('skill = @p' + params.length); params.push(testSet.skill); }

    if (fields.length === 0) return this.getTestSet(id);

    const setClause = fields.join(', ');
    await query(`UPDATE dbo.aptis_sets SET ${setClause} WHERE id = @p${params.length}`, [...params, idNum]);
    return this.getTestSet(id);
  }

  async deleteTestSet(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    const result = await query(`DELETE FROM dbo.aptis_sets WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  // Questions
  private mapQuestionRow(r: any): Question {
    const options = r.optionsJson ? safeParseJsonArray(r.optionsJson) : [];
    const correctAnswers = r.answerKey ? safeParseJsonArray(r.answerKey) : [];
    return {
      id: String(r.id),
      title: r.title ?? null,
      skill: r.skill,
      type: r.type,
      points: r.score ?? 1,
      tags: [],
      content: r.stem,
      options,
      correctAnswers,
      mediaUrl: r.mediaUrl ?? null,
      explanation: r.explain ?? null,
    } as unknown as Question;
  }

  async getAllQuestions(): Promise<Question[]> {
    const result = await query(`
      SELECT q.id, q.title, q.skill, q.[type], q.stem, q.optionsJson, q.answerKey, q.explain, m.url AS mediaUrl
      FROM dbo.aptis_questions q
      LEFT JOIN dbo.aptis_media m ON m.id = q.mediaId
      ORDER BY q.createdAt DESC
    `);
    return (result.recordset || []).map((r: any) => this.mapQuestionRow(r));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const idNum = parseInt(id, 10);
    const result = await query(
      `SELECT q.id, q.title, q.skill, q.[type], q.stem, q.optionsJson, q.answerKey, q.explain, m.url AS mediaUrl
       FROM dbo.aptis_questions q
       LEFT JOIN dbo.aptis_media m ON m.id = q.mediaId
       WHERE q.id = @p0`,
      [idNum]
    );
    const r = result.recordset?.[0];
    return r ? this.mapQuestionRow(r) : undefined;
  }

  async getQuestionsBySkill(skill: string): Promise<Question[]> {
    const result = await query(
      `SELECT q.id, q.title, q.skill, q.[type], q.stem, q.optionsJson, q.answerKey, q.explain, m.url AS mediaUrl
       FROM dbo.aptis_questions q
       LEFT JOIN dbo.aptis_media m ON m.id = q.mediaId
       WHERE q.skill = @p0
       ORDER BY q.createdAt DESC`,
      [skill]
    );
    return (result.recordset || []).map((r: any) => this.mapQuestionRow(r));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const optionsJson = question.options ? JSON.stringify(question.options) : null;
    const answerKey = question.correctAnswers ? JSON.stringify(question.correctAnswers) : null;
    const result = await query(
      `INSERT INTO dbo.aptis_questions(title, skill, [type], stem, optionsJson, answerKey, explain)
       OUTPUT INSERTED.id
       VALUES(@p0, @p1, @p2, @p3, @p4, @p5, @p6)`,
      [
        (question as any).title ?? null,
        question.skill,
        question.type,
        question.content,
        optionsJson,
        answerKey,
        (question as any).explanation ?? null,
      ]
    );
    const id = String(result.recordset[0].id);
    const created = await this.getQuestion(id);
    if (!created) throw new Error('Failed to create question');
    return created;
  }

  async updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const idNum = parseInt(id, 10);
    const fields: string[] = [];
    const params: any[] = [];
    if ((question as any).title !== undefined) { fields.push('title = @p' + params.length); params.push((question as any).title); }
    if (question.skill !== undefined) { fields.push('skill = @p' + params.length); params.push(question.skill); }
    if (question.type !== undefined) { fields.push('[type] = @p' + params.length); params.push(question.type); }
    if ((question as any).content !== undefined) { fields.push('stem = @p' + params.length); params.push((question as any).content); }
    if ((question as any).options !== undefined) { fields.push('optionsJson = @p' + params.length); params.push(JSON.stringify((question as any).options)); }
    if ((question as any).correctAnswers !== undefined) { fields.push('answerKey = @p' + params.length); params.push(JSON.stringify((question as any).correctAnswers)); }
    if ((question as any).explanation !== undefined) { fields.push('explain = @p' + params.length); params.push((question as any).explanation); }
    if (fields.length === 0) return this.getQuestion(id);
    const setClause = fields.join(', ');
    await query(`UPDATE dbo.aptis_questions SET ${setClause} WHERE id = @p${params.length}`, [...params, idNum]);
    return this.getQuestion(id);
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    const result = await query(`DELETE FROM dbo.aptis_questions WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  // Tips
  async getAllTips(): Promise<Tip[]> {
    const result = await query(`
      SELECT id, title, skill, content, [status], priority, createdAt
      FROM dbo.aptis_tips
      ORDER BY createdAt DESC
    `);
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      title: r.title,
      skill: r.skill,
      content: r.content,
      status: r.status ?? 'published',
      priority: r.priority ?? 'medium',
      createdAt: r.createdAt,
    } as unknown as Tip));
  }

  async getTip(id: string): Promise<Tip | undefined> {
    const idNum = parseInt(id, 10);
    const result = await query(`SELECT id, title, skill, content, [status], priority, createdAt FROM dbo.aptis_tips WHERE id = @p0`, [idNum]);
    const r = result.recordset?.[0];
    if (!r) return undefined;
    return {
      id: String(r.id),
      title: r.title,
      skill: r.skill,
      content: r.content,
      status: r.status ?? 'published',
      priority: r.priority ?? 'medium',
      createdAt: r.createdAt,
    } as unknown as Tip;
  }

  async getTipsBySkill(skill: string): Promise<Tip[]> {
    const result = await query(
      `SELECT id, title, skill, content, [status], priority, createdAt FROM dbo.aptis_tips WHERE skill = @p0 ORDER BY createdAt DESC`,
      [skill]
    );
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      title: r.title,
      skill: r.skill,
      content: r.content,
      status: r.status ?? 'published',
      priority: r.priority ?? 'medium',
      createdAt: r.createdAt,
    } as unknown as Tip));
  }

  async createTip(tip: InsertTip): Promise<Tip> {
    const result = await query(
      `INSERT INTO dbo.aptis_tips(title, skill, content, [status], priority)
       OUTPUT INSERTED.id
       VALUES(@p0, @p1, @p2, @p3, @p4)`,
      [tip.title, tip.skill, tip.content, tip.status ?? 'published', (tip as any).priority ?? 'medium']
    );
    const id = String(result.recordset[0].id);
    const created = await this.getTip(id);
    if (!created) throw new Error('Failed to create tip');
    return created;
  }

  async updateTip(id: string, tip: Partial<InsertTip>): Promise<Tip | undefined> {
    const idNum = parseInt(id, 10);
    const fields: string[] = [];
    const params: any[] = [];
    if (tip.title !== undefined) { fields.push('title = @p' + params.length); params.push(tip.title); }
    if (tip.skill !== undefined) { fields.push('skill = @p' + params.length); params.push(tip.skill); }
    if (tip.content !== undefined) { fields.push('content = @p' + params.length); params.push(tip.content); }
    if ((tip as any).status !== undefined) { fields.push('[status] = @p' + params.length); params.push((tip as any).status); }
    if ((tip as any).priority !== undefined) { fields.push('priority = @p' + params.length); params.push((tip as any).priority); }
    if (fields.length === 0) return this.getTip(id);
    const setClause = fields.join(', ');
    await query(`UPDATE dbo.aptis_tips SET ${setClause} WHERE id = @p${params.length}`, [...params, idNum]);
    return this.getTip(id);
  }

  async deleteTip(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    const result = await query(`DELETE FROM dbo.aptis_tips WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  // Media
  async getAllMedia(): Promise<Media[]> {
    const result = await query(`
      SELECT id, name, [type], url, createdAt FROM dbo.aptis_media ORDER BY createdAt DESC
    `);
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      filename: r.name,
      type: r.type,
      url: r.url,
      uploadedAt: r.createdAt,
    } as unknown as Media));
  }

  async getMedia(id: string): Promise<Media | undefined> {
    const idNum = parseInt(id, 10);
    const result = await query(`SELECT id, name, [type], url, createdAt FROM dbo.aptis_media WHERE id = @p0`, [idNum]);
    const r = result.recordset?.[0];
    if (!r) return undefined;
    return {
      id: String(r.id),
      filename: r.name,
      type: r.type,
      url: r.url,
      uploadedAt: r.createdAt,
    } as unknown as Media;
  }

  async createMedia(media: InsertMedia): Promise<Media> {
    const result = await query(
      `INSERT INTO dbo.aptis_media(name, [type], url)
       OUTPUT INSERTED.id
       VALUES(@p0, @p1, @p2)`,
      [media.filename, media.type, media.url]
    );
    const id = String(result.recordset[0].id);
    const created = await this.getMedia(id);
    if (!created) throw new Error('Failed to create media');
    return created;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    const result = await query(`DELETE FROM dbo.aptis_media WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  // Activities & Stats
  async getAllActivities(): Promise<Activity[]> {
    const result = await query(`SELECT TOP 100 id, action, details, createdAt FROM dbo.aptis_audit_logs ORDER BY createdAt DESC`);
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      action: r.action,
      resourceType: inferResourceType(r.details),
      resourceTitle: inferResourceTitle(r.details),
      timestamp: r.createdAt,
    } as unknown as Activity));
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    const result = await query(`
      SELECT TOP(${Math.max(1, Math.min(100, limit))}) id, action, details, createdAt
      FROM dbo.aptis_audit_logs
      ORDER BY createdAt DESC
    `);
    return (result.recordset || []).map((r: any) => ({
      id: String(r.id),
      action: r.action,
      resourceType: inferResourceType(r.details),
      resourceTitle: inferResourceTitle(r.details),
      timestamp: r.createdAt,
    } as unknown as Activity));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const details = JSON.stringify({ resourceType: (activity as any).resourceType, resourceTitle: (activity as any).resourceTitle });
    const result = await query(
      `INSERT INTO dbo.aptis_audit_logs(action, details)
       OUTPUT INSERTED.id, INSERTED.action, INSERTED.details, INSERTED.createdAt
       VALUES(@p0, @p1)`,
      [activity.action, details]
    );
    const r = result.recordset[0];
    return {
      id: String(r.id),
      action: r.action,
      resourceType: inferResourceType(r.details),
      resourceTitle: inferResourceTitle(r.details),
      timestamp: r.createdAt,
    } as unknown as Activity;
  }

  async getStats(): Promise<{ setsCount: number; questionsCount: number; tipsCount: number; mediaCount: number; }> {
    const [sets, questions, tips, media] = await Promise.all([
      query(`SELECT COUNT(*) AS c FROM dbo.aptis_sets`),
      query(`SELECT COUNT(*) AS c FROM dbo.aptis_questions`),
      query(`SELECT COUNT(*) AS c FROM dbo.aptis_tips`),
      query(`SELECT COUNT(*) AS c FROM dbo.aptis_media`),
    ]);
    return {
      setsCount: sets.recordset?.[0]?.c ?? 0,
      questionsCount: questions.recordset?.[0]?.c ?? 0,
      tipsCount: tips.recordset?.[0]?.c ?? 0,
      mediaCount: media.recordset?.[0]?.c ?? 0,
    };
  }

  async getQuestionDistribution(): Promise<{ reading: number; listening: number; speaking: number; writing: number; }> {
    const result = await query(`
      SELECT LOWER(skill) AS skill, COUNT(*) AS c
      FROM dbo.aptis_questions
      GROUP BY skill
    `);
    const map: Record<string, number> = { reading: 0, listening: 0, speaking: 0, writing: 0 };
    for (const r of result.recordset || []) {
      if (r.skill && map.hasOwnProperty(r.skill)) map[r.skill] = r.c;
    }
    return {
      reading: map.reading,
      listening: map.listening,
      speaking: map.speaking,
      writing: map.writing,
    };
  }

  // Template methods
  async getAllTemplates(): Promise<QuestionTemplate[]> {
    const result = await query(`
      SELECT id, label, [description], skillsJson, typesJson, content, optionsJson, correctAnswersJson, tagsJson, difficulty, createdAt, updatedAt
      FROM dbo.aptis_templates
      ORDER BY createdAt DESC
    `);
    return (result.recordset || []).map(mapTemplateRow);
  }

  async createTemplate(template: InsertQuestionTemplate): Promise<QuestionTemplate> {
    const result = await query(
      `
      INSERT INTO dbo.aptis_templates(label, [description], skillsJson, typesJson, content, optionsJson, correctAnswersJson, tagsJson, difficulty)
      OUTPUT INSERTED.id, INSERTED.label, INSERTED.[description], INSERTED.skillsJson, INSERTED.typesJson,
             INSERTED.content, INSERTED.optionsJson, INSERTED.correctAnswersJson, INSERTED.tagsJson,
             INSERTED.difficulty, INSERTED.createdAt, INSERTED.updatedAt
      VALUES(@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)
    `,
      [
        template.label,
        template.description,
        JSON.stringify(template.skills ?? []),
        JSON.stringify(template.types ?? []),
        template.content,
        template.options ? JSON.stringify(template.options) : null,
        template.correctAnswers ? JSON.stringify(template.correctAnswers) : null,
        template.tags ? JSON.stringify(template.tags) : null,
        template.difficulty ?? null,
      ],
    );
    return mapTemplateRow(result.recordset[0]);
  }

  async updateTemplate(id: string, template: Partial<InsertQuestionTemplate>): Promise<QuestionTemplate | undefined> {
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return undefined;
    const fields: string[] = [];
    const params: any[] = [];

    if (template.label !== undefined) {
      fields.push(`label = @p${params.length}`);
      params.push(template.label);
    }
    if (template.description !== undefined) {
      fields.push(`[description] = @p${params.length}`);
      params.push(template.description);
    }
    if (template.skills !== undefined) {
      fields.push(`skillsJson = @p${params.length}`);
      params.push(JSON.stringify(template.skills));
    }
    if (template.types !== undefined) {
      fields.push(`typesJson = @p${params.length}`);
      params.push(JSON.stringify(template.types));
    }
    if (template.content !== undefined) {
      fields.push(`content = @p${params.length}`);
      params.push(template.content);
    }
    if (template.options !== undefined) {
      fields.push(`optionsJson = @p${params.length}`);
      params.push(template.options ? JSON.stringify(template.options) : null);
    }
    if (template.correctAnswers !== undefined) {
      fields.push(`correctAnswersJson = @p${params.length}`);
      params.push(template.correctAnswers ? JSON.stringify(template.correctAnswers) : null);
    }
    if (template.tags !== undefined) {
      fields.push(`tagsJson = @p${params.length}`);
      params.push(template.tags ? JSON.stringify(template.tags) : null);
    }
    if (template.difficulty !== undefined) {
      fields.push(`difficulty = @p${params.length}`);
      params.push(template.difficulty ?? null);
    }
    if (fields.length === 0) {
      return this.getTemplateById(idNum);
    }
    fields.push(`updatedAt = SYSUTCDATETIME()`);
    const setClause = fields.join(", ");
    await query(`UPDATE dbo.aptis_templates SET ${setClause} WHERE id = @p${params.length}`, [...params, idNum]);
    return this.getTemplateById(idNum);
  }

  private async getTemplateById(id: number): Promise<QuestionTemplate | undefined> {
    const result = await query(
      `
      SELECT id, label, [description], skillsJson, typesJson, content, optionsJson, correctAnswersJson, tagsJson, difficulty, createdAt, updatedAt
      FROM dbo.aptis_templates
      WHERE id = @p0
    `,
      [id],
    );
    const row = result.recordset?.[0];
    return row ? mapTemplateRow(row) : undefined;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const idNum = parseInt(id, 10);
    if (Number.isNaN(idNum)) return false;
    const result = await query(`DELETE FROM dbo.aptis_templates WHERE id = @p0`, [idNum]);
    return (result.rowsAffected?.[0] ?? 0) > 0;
  }

  async resetTemplates(): Promise<void> {
    await query(`DELETE FROM dbo.aptis_templates`);
    for (const template of DEFAULT_TEMPLATE_SEEDS) {
      await this.createTemplate(template);
    }
  }
}

function safeParseJsonArray(v: any): string[] {
  try {
    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function inferResourceType(details: any): string {
  try {
    const d = typeof details === 'string' ? JSON.parse(details) : details;
    if (d && typeof d.resourceType === 'string') return d.resourceType;
  } catch {}
  return 'general';
}

function inferResourceTitle(details: any): string {
  try {
    const d = typeof details === 'string' ? JSON.parse(details) : details;
    if (d && typeof d.resourceTitle === 'string') return d.resourceTitle;
    if (d && typeof d.title === 'string') return d.title;
  } catch {}
  return 'Activity';
}

function mapTemplateRow(row: any): QuestionTemplate {
  return {
    id: String(row.id),
    label: row.label,
    description: row.description,
    skills: safeParseJsonArray(row.skillsJson),
    types: safeParseJsonArray(row.typesJson) as Question["type"][],
    content: row.content,
    options: safeParseJsonArray(row.optionsJson),
    correctAnswers: safeParseJsonArray(row.correctAnswersJson),
    tags: safeParseJsonArray(row.tagsJson),
    difficulty: row.difficulty ?? null,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? null,
  };
}

export const storage: IStorage = process.env.DATABASE_URL ? new SqlStorage() : new MemStorage();
