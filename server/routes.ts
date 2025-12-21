import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTestSetSchema,
  insertQuestionSchema,
  insertTipSchema,
  insertLessonSchema,
  insertMediaSchema,
  insertUserSchema,
  type User,
  type InsertUser,
  type InsertQuestionTemplate,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import { query } from "./db";
import multer from 'multer';
import path from 'path';
import * as XLSX from "xlsx";
import { isR2Enabled, uploadBufferToR2, getR2PublicUrl, buildR2Key } from "./lib/r2";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const QUESTION_SKILLS = ["Reading", "Listening", "Speaking", "Writing", "GrammarVocabulary", "General"] as const;
const QUESTION_TYPES = ["mcq_single", "mcq_multi", "fill_blank", "writing_prompt", "speaking_prompt"] as const;
const COURSE_STATUSES = ["open", "closed"] as const;
const COURSE_MEMBER_STATUSES = ["pending", "approved", "rejected"] as const;

const templateSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  skills: z.array(z.enum(QUESTION_SKILLS)).min(1),
  types: z.array(z.enum(QUESTION_TYPES)).min(1),
  content: z.string().min(1),
  options: z.array(z.string().min(1)).optional(),
  correctAnswers: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).optional(),
  difficulty: z.string().max(20).optional().nullable(),
});
const templateUpdateSchema = templateSchema.partial();

const courseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(50),
  description: z.string().optional().nullable(),
  status: z.enum(COURSE_STATUSES).optional(),
});
const courseUpdateSchema = courseSchema.partial();
const courseMemberStatusSchema = z.enum(COURSE_MEMBER_STATUSES);

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth gate for protected routes
  function requireAuth(req: any, res: any, next: any) {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  }
  function requireAdmin(req: any, res: any, next: any) {
    if (!req.session?.userId || req.session?.role !== 'admin') {
      return res.status(403).json({ error: "Admin only" });
    }
    next();
  }

  const uploadDir = path.resolve(import.meta.dirname, "..", "uploads");
  const storageM = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
    filename: (_req: any, file: any, cb: any) => {
      const ts = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
      cb(null, `${ts}_${safe}`);
    },
  });
  const uploadStorage = isR2Enabled ? multer.memoryStorage() : storageM;
  const upload = multer({ storage: uploadStorage });
  const excelUpload = multer({ storage: multer.memoryStorage() });

  const mapUserResponse = (user: User) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
  });

  const mapProfileResponse = (user: User) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
  });

  const getPublicBaseUrl = (req: any) => {
    const envBase = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL;
    if (envBase) return envBase.replace(/\/$/, "");
    const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http").toString().split(",")[0].trim();
    const host = (req.headers["x-forwarded-host"] || req.get("host") || "").toString().split(",")[0].trim();
    return `${proto}://${host}`;
  };

  const resolvePublicUrl = (req: any, url?: string | null) => {
    if (!url) return url ?? null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/")) return `${getPublicBaseUrl(req)}${url}`;
    return url;
  };
  // Health endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      let db: any = null;
      try {
        const r = await query("SELECT 1 AS ok");
        db = { ok: true, result: r.recordset?.[0]?.ok === 1 };
      } catch (err: any) {
        db = { ok: false, error: err?.message ?? String(err) };
      }

      res.json({
        status: "ok",
        storage: process.env.DATABASE_URL ? "sql" : "memory",
        db,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        avatar: user.avatar ?? null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const sessionUserId = String(req.session.userId);
    const user = await storage.getUser(sessionUserId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      avatar: user.avatar ?? null,
    });
  });

  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const sessionUserId = String(req.session.userId);
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(mapProfileResponse(user));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const payload = parsed.data;
      const sessionUserId = String(req.session.userId);
      if (payload.username) {
        const exists = await storage.getUserByUsername(payload.username);
        if (exists && exists.id !== sessionUserId) {
          return res.status(409).json({ error: "Username already exists" });
        }
      }
      const updateData: Partial<InsertUser> = {};
      if (payload.username) updateData.username = payload.username;
      if (payload.avatar !== undefined) updateData.avatar = payload.avatar === "" ? null : payload.avatar;
      if (payload.password) updateData.password = payload.password;

      const updated = await storage.updateUser(sessionUserId, updateData);
      if (!updated) return res.status(404).json({ error: "User not found" });
      if (payload.username) {
        req.session.username = updated.username;
      }

      res.json(mapProfileResponse(updated));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Admin user management endpoints
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(mapUserResponse));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }

      const exists = await storage.getUserByUsername(parsed.data.username);
      if (exists) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const created = await storage.createUser(parsed.data);
      await storage.createActivity({
        action: "created",
        resourceType: "user",
        resourceTitle: created.username,
      });

      res.status(201).json(mapUserResponse(created));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }

      if (Object.keys(parsed.data).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      if (parsed.data.username) {
        const exists = await storage.getUserByUsername(parsed.data.username);
        if (exists && exists.id !== req.params.id) {
          return res.status(409).json({ error: "Username already exists" });
        }
      }

      const updated = await storage.updateUser(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createActivity({
        action: "updated",
        resourceType: "user",
        resourceTitle: updated.username,
      });

      res.json(mapUserResponse(updated));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      if (String(req.session.userId) === req.params.id) {
        return res.status(400).json({ error: "Cannot delete current session user" });
      }

      const existing = await storage.getUser(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createActivity({
        action: "deleted",
        resourceType: "user",
        resourceTitle: existing.username,
      });

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats endpoints
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/questions/distribution", async (_req, res) => {
    try {
      const distribution = await storage.getQuestionDistribution();
      res.json(distribution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test Sets endpoints
  app.get("/api/test-sets", async (_req, res) => {
    try {
      const testSets = await storage.getAllTestSets();
      res.json(testSets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/test-sets/:id", async (req, res) => {
    try {
      const testSet = await storage.getTestSet(req.params.id);
      if (!testSet) {
        return res.status(404).json({ error: "Test set not found" });
      }
      res.json(testSet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/test-sets", async (req, res) => {
    try {
      const result = insertTestSetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const testSet = await storage.createTestSet(result.data);
      res.status(201).json(testSet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/test-sets/:id", async (req, res) => {
    try {
      const result = insertTestSetSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const testSet = await storage.updateTestSet(req.params.id, result.data);
      if (!testSet) {
        return res.status(404).json({ error: "Test set not found" });
      }
      res.json(testSet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/test-sets/:id", async (req, res) => {
    try {
      const success = await storage.deleteTestSet(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Test set not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Question template endpoints
  app.get("/api/templates", requireAuth, async (_req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates", requireAdmin, async (req, res) => {
    try {
      const parsed = templateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const payload: InsertQuestionTemplate = parsed.data;
      const template = await storage.createTemplate(payload);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/templates/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = templateUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const updated = await storage.updateTemplate(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/templates/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteTemplate(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/reset", requireAdmin, async (_req, res) => {
    try {
      await storage.resetTemplates();
      res.json({ message: "Templates reset" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Questions endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const { skill, type, q } = req.query as Record<string, string | undefined>;
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const size = Math.max(1, Math.min(200, parseInt((req.query.size as string) || "50", 10)));

      if (process.env.DATABASE_URL) {
        const where: string[] = [];
        const params: any[] = [];

        if (skill && skill !== "all") {
          where.push(`q.skill = @p${params.length}`);
          params.push(skill);
        }
        if (type && type !== "all") {
          where.push(`q.[type] = @p${params.length}`);
          params.push(type);
        }
        if (q) {
          where.push(`(q.title LIKE @p${params.length} OR q.stem LIKE @p${params.length})`);
          params.push(`%${q}%`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const offset = (page - 1) * size;

        const rows = await query(
          `
          SELECT q.id, q.title, q.skill, q.[type], q.stem, q.optionsJson, q.answerKey, q.explain, m.url AS mediaUrl
          FROM dbo.aptis_questions q
          LEFT JOIN dbo.aptis_media m ON m.id = q.mediaId
          ${whereSql}
          ORDER BY q.id DESC
          OFFSET @p${params.length} ROWS FETCH NEXT @p${params.length + 1} ROWS ONLY
        `,
          [...params, offset, size],
        );

        const totalResult = await query(
          `
          SELECT COUNT(*) AS total
          FROM dbo.aptis_questions q
          ${whereSql}
        `,
          params,
        );

        const total = totalResult.recordset?.[0]?.total ?? 0;
        const items = (rows.recordset || []).map((r: any) => ({
          id: String(r.id),
          title: r.title ?? null,
          skill: r.skill,
          type: r.type,
          points: 1,
          tags: [],
          content: r.stem,
          options: r.optionsJson ? JSON.parse(r.optionsJson) : [],
          correctAnswers: r.answerKey ? JSON.parse(r.answerKey) : [],
          mediaUrl: resolvePublicUrl(req, r.mediaUrl ?? null),
          explanation: r.explain ?? null,
        }));

        return res.json({
          items,
          page,
          size,
          total,
          hasMore: offset + items.length < total,
        });
      }

      // Fallback: in-memory filtering
      let list = await storage.getAllQuestions();
      if (skill && skill !== "all") {
        list = list.filter((qi) => qi.skill === skill);
      }
      if (type && type !== "all") {
        list = list.filter((qi) => qi.type === type);
      }
      if (q) {
        const qq = q.toLowerCase();
        list = list.filter(
          (qi) =>
            (qi.title || "").toLowerCase().includes(qq) ||
            (qi.content || "").toLowerCase().includes(qq),
        );
      }

      const start = (page - 1) * size;
      const paged = list.slice(start, start + size).map((question) => ({
        ...question,
        mediaUrl: resolvePublicUrl(req, question.mediaUrl ?? null),
      }));
      const total = list.length;

      res.json({
        items: paged,
        page,
        size,
        total,
        hasMore: start + paged.length < total,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/questions/:id/sets", async (req, res) => {
    try {
      const questionId = parseInt(req.params.id, 10);
      if (Number.isNaN(questionId)) {
        return res.status(400).json({ error: "Invalid question id" });
      }
      const result = await query(
        `
        SELECT s.id, s.title, s.skill, s.status, s.questionCount, s.updatedAt
        FROM dbo.aptis_set_questions sq
        JOIN dbo.aptis_sets s ON s.id = sq.setId
        WHERE sq.questionId = @p0
        ORDER BY s.updatedAt DESC
      `,
        [questionId],
      );
      res.json(result.recordset || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json({
        ...question,
        mediaUrl: resolvePublicUrl(req, question.mediaUrl ?? null),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const result = insertQuestionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const question = await storage.createQuestion(result.data);
      res.status(201).json({
        ...question,
        mediaUrl: resolvePublicUrl(req, question.mediaUrl ?? null),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/questions/:id", async (req, res) => {
    try {
      const result = insertQuestionSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const question = await storage.updateQuestion(req.params.id, result.data);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json({
        ...question,
        mediaUrl: resolvePublicUrl(req, question.mediaUrl ?? null),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const success = await storage.deleteQuestion(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: bulk import questions
  app.post('/api/admin/questions/import', async (req, res) => {
    try {
      if (!req.session?.userId || req.session?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }
      const { items, csv } = req.body as any;
      let toImport: any[] = [];
      if (Array.isArray(items)) {
        toImport = items;
      } else if (typeof csv === 'string' && csv.trim()) {
        // Naive CSV parsing: header: title,skill,type,content,options,correctAnswers,explanation,mediaUrl
        const lines = csv.split(/\r?\n/).filter(Boolean);
        if (lines.length > 0) {
          const header = lines[0].split(',').map(s => s.trim());
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            const row: any = {};
            header.forEach((h, idx) => row[h] = (cols[idx] ?? '').trim());
            const options = row.options ? String(row.options).split(';').map((s: string)=>s.trim()).filter(Boolean) : [];
            const correctAnswers = row.correctAnswers ? String(row.correctAnswers).split(';').map((s: string)=>s.trim()).filter(Boolean) : [];
            toImport.push({
              title: row.title || null,
              skill: row.skill,
              type: row.type,
              content: row.content,
              options,
              correctAnswers,
              explanation: row.explanation || null,
              mediaUrl: row.mediaUrl || null,
              points: 1,
              tags: [],
            });
          }
        }
      } else {
        return res.status(400).json({ error: 'Provide items[] or csv' });
      }

      const results: { ok: boolean; id?: string; error?: string }[] = [];
      for (const qItem of toImport) {
        try {
          if (process.env.DATABASE_URL) {
            const optionsJson = qItem.options ? JSON.stringify(qItem.options) : null;
            const answerKey = qItem.correctAnswers ? JSON.stringify(qItem.correctAnswers) : null;
            const ins = await query(`INSERT INTO dbo.aptis_questions(title, skill, [type], stem, optionsJson, answerKey, explain)
              OUTPUT INSERTED.id
              VALUES(@p0,@p1,@p2,@p3,@p4,@p5,@p6)`, [qItem.title ?? null, qItem.skill, qItem.type, qItem.content, optionsJson, answerKey, qItem.explanation ?? null]);
            results.push({ ok: true, id: String(ins.recordset[0].id) });
          } else {
            const created = await storage.createQuestion(qItem);
            results.push({ ok: true, id: created.id });
          }
        } catch (e: any) {
          results.push({ ok: false, error: e?.message || String(e) });
        }
      }
      const okCount = results.filter(r => r.ok).length;
      const fail = results.filter(r => !r.ok);
      res.json({ imported: okCount, failed: fail.length, errors: fail });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/questions/import-excel", requireAdmin, excelUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return res.status(400).json({ error: "Excel file has no sheets" });
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      let imported = 0;
      const errors: Array<{ row: number; error: string }> = [];

      const listFromCell = (value: any) => {
        if (Array.isArray(value)) return value.map((item) => String(item)).filter((v) => v.trim().length > 0);
        if (typeof value === "string" && value.trim().length > 0) {
          return value
            .split(/[,;|\n\r]+/)
            .map((item) => item.trim())
            .filter(Boolean);
        }
        return [];
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const title = row.title || row.Title || "";
        const skill = row.skill || row.Skill || "";
        const type = row.type || row.Type || "";
        const content = row.content || row.Content || "";

        if (!title || !skill || !type || !content) {
          errors.push({ row: i + 2, error: "Missing required fields (title, skill, type, content)" });
          continue;
        }

        const options = listFromCell(row.options || row.Options);
        const correctAnswers = listFromCell(row.correctAnswers || row.CorrectAnswers);
        const tags = listFromCell(row.tags || row.Tags);
        const explanation = row.explanation || row.Explanation || "";
        const mediaUrl = row.mediaUrl || row.MediaUrl || "";
        const pointsValue = Number(row.points ?? row.Points);
        const points = Number.isFinite(pointsValue) && pointsValue > 0 ? pointsValue : 1;

        try {
          await storage.createQuestion({
            title,
            skill,
            type,
            content,
            options,
            correctAnswers,
            tags,
            points,
            explanation,
            mediaUrl,
          });
          imported += 1;
        } catch (err: any) {
          errors.push({ row: i + 2, error: err?.message ?? "Failed to insert question" });
        }
      }

      let sourceUrl: string | null = null;
      if (isR2Enabled) {
        const excelKey = buildR2Key(req.file.originalname, req.file.mimetype ?? "application/vnd.ms-excel");
        await uploadBufferToR2({
          key: excelKey,
          body: req.file.buffer,
          contentType: req.file.mimetype ?? "application/vnd.ms-excel",
        });
        sourceUrl = getR2PublicUrl(excelKey);
      }

      res.json({ imported, failed: errors.length, errors, sourceUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tips endpoints
  app.get("/api/tips", async (req, res) => {
    try {
      const { skill } = req.query;
      let tips;
      if (skill && typeof skill === "string") {
        tips = await storage.getTipsBySkill(skill);
      } else {
        tips = await storage.getAllTips();
      }
      res.json(tips);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tips/:id", async (req, res) => {
    try {
      const tip = await storage.getTip(req.params.id);
      if (!tip) {
        return res.status(404).json({ error: "Tip not found" });
      }
      res.json(tip);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tips", async (req, res) => {
    try {
      const result = insertTipSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const tip = await storage.createTip(result.data);
      res.status(201).json(tip);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tips/:id", async (req, res) => {
    try {
      const result = insertTipSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const tip = await storage.updateTip(req.params.id, result.data);
      if (!tip) {
        return res.status(404).json({ error: "Tip not found" });
      }
      res.json(tip);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tips/:id", async (req, res) => {
    try {
      const success = await storage.deleteTip(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Tip not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lesson endpoints
    app.get("/api/lessons", async (req, res) => {
      try {
        const { skill, status, search, courseId } = req.query as Record<string, string | undefined>;
        let lessons = await storage.getAllLessons();
        if (skill && skill !== "all") {
          lessons = lessons.filter((lesson) => lesson.skill === skill);
        }
        if (status && status !== "all") {
          lessons = lessons.filter((lesson) => lesson.status === status);
        }
        if (courseId && courseId !== "all") {
          lessons = lessons.filter((lesson) => String(lesson.courseId ?? "") === String(courseId));
        }
        if (search) {
          const q = search.toLowerCase();
          lessons = lessons.filter((lesson) => {
            const hay = `${lesson.title} ${lesson.description ?? ""} ${lesson.content}`.toLowerCase();
            return hay.includes(q);
        });
      }
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/lessons", async (req, res) => {
    try {
      const result = insertLessonSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const lesson = await storage.createLesson(result.data);
      res.status(201).json(lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const result = insertLessonSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const lesson = await storage.updateLesson(req.params.id, result.data);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const success = await storage.deleteLesson(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Courses endpoints
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      const userId = String(req.session.userId);
      if (process.env.DATABASE_URL) {
        const userNum = parseInt(userId, 10);
        const result = await query(
          `
          SELECT c.id, c.code, c.name, c.[description], c.[status], c.createdBy, c.createdAt,
                 m.[status] AS enrollmentStatus
          FROM dbo.aptis_classes c
          LEFT JOIN dbo.aptis_class_members m ON m.classId = c.id AND m.userId = @p0
          ORDER BY c.createdAt DESC
          `,
          [userNum],
        );
        const rows = (result.recordset || []).map((r: any) => ({
          id: String(r.id),
          code: r.code,
          name: r.name,
          description: r.description ?? null,
          status: r.status ?? "open",
          createdBy: r.createdBy ? String(r.createdBy) : null,
          createdAt: r.createdAt ?? new Date(),
          enrollmentStatus: r.enrollmentStatus ?? "none",
        }));
        return res.json(rows);
      }

      const courses = await storage.getAllCourses();
      const memberships = await storage.getCourseMembersByUser(userId);
      const membershipMap = new Map(memberships.map((member) => [member.courseId, member.status]));
      const payload = courses.map((course) => ({
        ...course,
        enrollmentStatus: membershipMap.get(course.id) ?? "none",
      }));
      res.json(payload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/courses/:id/apply", requireAuth, async (req, res) => {
    try {
      const userId = String(req.session.userId);
      const courseId = req.params.id;
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      if (course.status && course.status !== "open") {
        return res.status(400).json({ error: "Course is not open for enrollment" });
      }
      const member = await storage.applyToCourse(courseId, userId);
      res.status(201).json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin course management
    app.get("/api/admin/courses", requireAdmin, async (_req, res) => {
      try {
        if (process.env.DATABASE_URL) {
          const result = await query(
            `
            SELECT c.id, c.code, c.name, c.[description], c.[status], c.createdBy, c.createdAt,
                   (SELECT COUNT(*) FROM dbo.aptis_class_members m WHERE m.classId = c.id AND m.[status] = N'pending') AS pendingCount,
                   (SELECT COUNT(*) FROM dbo.aptis_class_members m WHERE m.classId = c.id AND m.[status] = N'approved') AS approvedCount,
                   (SELECT COUNT(*) FROM dbo.aptis_lessons l WHERE l.courseId = c.id) AS lessonCount
            FROM dbo.aptis_classes c
            ORDER BY c.createdAt DESC
            `
          );
          return res.json(
            (result.recordset || []).map((r: any) => ({
              id: String(r.id),
              code: r.code,
              name: r.name,
              description: r.description ?? null,
              status: r.status ?? "open",
              createdBy: r.createdBy ? String(r.createdBy) : null,
              createdAt: r.createdAt ?? new Date(),
              pendingCount: r.pendingCount ?? 0,
              approvedCount: r.approvedCount ?? 0,
              lessonCount: r.lessonCount ?? 0,
            }))
          );
        }

        const courses = await storage.getAllCourses();
        const lessons = await storage.getAllLessons();
        const payload = await Promise.all(
          courses.map(async (course) => {
            const members = await storage.getCourseMembers(course.id);
            return {
              ...course,
              pendingCount: members.filter((member) => member.status === "pending").length,
              approvedCount: members.filter((member) => member.status === "approved").length,
              lessonCount: lessons.filter((lesson) => String(lesson.courseId ?? "") === course.id).length,
            };
          }),
        );
      res.json(payload);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const parsed = courseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const payload = parsed.data;
      const created = await storage.createCourse({
        ...payload,
        createdBy: String(req.session.userId),
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = courseUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const updated = await storage.updateCourse(req.params.id, parsed.data);
      if (!updated) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCourse(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/courses/:id/applications", requireAdmin, async (req, res) => {
    try {
      const courseId = req.params.id;
      const status = req.query.status as string | undefined;
      if (process.env.DATABASE_URL) {
        const courseNum = parseInt(courseId, 10);
        const params: any[] = [courseNum];
        let statusClause = "";
        if (status) {
          params.push(status);
          statusClause = ` AND m.[status] = @p${params.length - 1}`;
        }
        const result = await query(
          `
          SELECT m.id, m.classId, m.userId, m.roleInClass, m.[status], m.joinedAt,
                 u.email, u.name, u.avatar
          FROM dbo.aptis_class_members m
          JOIN dbo.aptis_users u ON u.id = m.userId
          WHERE m.classId = @p0${statusClause}
          ORDER BY m.joinedAt DESC
          `,
          params,
        );
        return res.json(
          (result.recordset || []).map((r: any) => ({
            id: String(r.id),
            courseId: String(r.classId),
            userId: String(r.userId),
            role: r.roleInClass ?? "student",
            status: r.status ?? "pending",
            joinedAt: r.joinedAt ?? new Date(),
            username: r.email ?? r.name ?? "Student",
            avatar: r.avatar ?? null,
          }))
        );
      }

      const members = await storage.getCourseMembers(courseId);
      const filtered = status ? members.filter((member) => member.status === status) : members;
      const withUsers = await Promise.all(
        filtered.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            username: user?.username ?? "Student",
            avatar: user?.avatar ?? null,
          };
        }),
      );
      res.json(withUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/course-members/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = z.object({ status: courseMemberStatusSchema }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: fromZodError(parsed.error).message });
      }
      const updated = await storage.updateCourseMemberStatus(req.params.id, parsed.data.status);
      if (!updated) {
        return res.status(404).json({ error: "Course member not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Media endpoints
  app.get("/api/media", async (req, res) => {
    try {
      const media = await storage.getAllMedia();
      const resolved = media.map((item) => ({
        ...item,
        url: resolvePublicUrl(req, item.url),
      }));
      res.json(resolved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const media = await storage.getMedia(req.params.id);
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }
      res.json({
        ...media,
        url: resolvePublicUrl(req, media.url),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/media", async (req, res) => {
    try {
      const result = insertMediaSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const media = await storage.createMedia(result.data);
      res.status(201).json(media);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const success = await storage.deleteMedia(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Media not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activities endpoints
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // ===================== Set Composition (set_questions) =====================
  // Get questions in a set with ordering and mapping fields
  app.get("/api/test-sets/:id/questions", async (req, res) => {
    try {
      const setId = parseInt(req.params.id, 10);
      const r = await query(`
        SELECT sq.questionId, sq.[section], sq.[order], sq.score,
               q.id, q.title, q.skill, q.[type], q.stem, q.optionsJson, q.answerKey, q.explain,
               m.url AS mediaUrl
        FROM dbo.aptis_set_questions sq
        JOIN dbo.aptis_questions q ON q.id = sq.questionId
        LEFT JOIN dbo.aptis_media m ON m.id = q.mediaId
        WHERE sq.setId = @p0
        ORDER BY sq.[order] ASC
      `, [setId]);
      const rows = r.recordset || [];
      const data = rows.map((row: any) => ({
        mapping: {
          questionId: row.questionId,
          section: row.section,
          order: row.order,
          score: row.score ?? null,
        },
        question: {
          id: String(row.id),
          title: row.title ?? null,
          skill: row.skill,
          type: row.type,
          content: row.stem,
          options: row.optionsJson ? JSON.parse(row.optionsJson) : [],
          correctAnswers: row.answerKey ? JSON.parse(row.answerKey) : [],
          explanation: row.explain ?? null,
          mediaUrl: resolvePublicUrl(req, row.mediaUrl ?? null),
          points: 1,
          tags: [],
        },
      }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add a question to a set
  app.post("/api/test-sets/:id/questions", requireAuth, async (req, res) => {
    try {
      const setId = parseInt(req.params.id, 10);
      const body = z.object({
        questionId: z.number().int(),
        section: z.string(),
        order: z.number().int().optional(),
        score: z.number().optional(),
      }).parse(req.body);

      // Determine next order if not provided
      let ord = body.order;
      if (ord === undefined) {
        const r = await query(`SELECT ISNULL(MAX([order]),0) + 1 AS nextOrd FROM dbo.aptis_set_questions WHERE setId = @p0`, [setId]);
        ord = r.recordset?.[0]?.nextOrd ?? 1;
      }
      await query(`
        INSERT INTO dbo.aptis_set_questions(setId, questionId, [section], [order], score)
        VALUES(@p0, @p1, @p2, @p3, @p4)
      `, [setId, body.questionId, body.section, ord, body.score ?? null]);
      res.status(201).json({ message: "added" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update mapping for a question in a set
  app.patch("/api/test-sets/:id/questions/:questionId", requireAuth, async (req, res) => {
    try {
      const setId = parseInt(req.params.id, 10);
      const questionId = parseInt(req.params.questionId, 10);
      const body = z.object({
        section: z.string().optional(),
        order: z.number().int().optional(),
        score: z.number().optional(),
      }).parse(req.body);
      const fields: string[] = [];
      const params: any[] = [];
      if (body.section !== undefined) { fields.push('[section] = @p' + params.length); params.push(body.section); }
      if (body.order !== undefined) { fields.push('[order] = @p' + params.length); params.push(body.order); }
      if (body.score !== undefined) { fields.push('score = @p' + params.length); params.push(body.score); }
      if (fields.length === 0) return res.json({ message: 'no-op' });
      const setClause = fields.join(', ');
      await query(`UPDATE dbo.aptis_set_questions SET ${setClause} WHERE setId = @p${params.length} AND questionId = @p${params.length+1}`, [...params, setId, questionId]);
      res.json({ message: 'updated' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Remove question from set
  app.delete("/api/test-sets/:id/questions/:questionId", requireAuth, async (req, res) => {
    try {
      const setId = parseInt(req.params.id, 10);
      const questionId = parseInt(req.params.questionId, 10);
      await query(`DELETE FROM dbo.aptis_set_questions WHERE setId = @p0 AND questionId = @p1`, [setId, questionId]);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== Submissions & Autoscore =====================
  const startSubmissionSchema = z.object({ setId: z.union([z.string(), z.number()]) });
  const saveAnswerSchema = z.object({
    questionId: z.union([z.string(), z.number()]),
    answer: z.any(),
    timeSpentSec: z.number().int().optional(),
    attempts: z.number().int().optional(),
  });
  const updateProfileSchema = z
    .object({
      username: z.string().min(3).max(50).optional(),
      avatar: z.union([z.string().url(), z.literal("")]).optional(),
      password: z.string().min(6).max(64).optional(),
    })
    .refine((val) => Object.values(val).some((field) => field !== undefined && field !== null), {
      message: "At least one field must be provided",
    });

  app.post("/api/submissions/start", requireAuth, async (req, res) => {
    try {
      const { setId } = startSubmissionSchema.parse(req.body);
      const setIdNum = typeof setId === 'string' ? parseInt(setId, 10) : setId;
      const userId = parseInt(String(req.session.userId), 10);
      const prev = await query(`SELECT ISNULL(MAX(attempt),0) AS maxAttempt FROM dbo.aptis_submissions WHERE userId = @p0 AND setId = @p1`, [userId, setIdNum]);
      const nextAttempt = (prev.recordset?.[0]?.maxAttempt ?? 0) + 1;
      const ins = await query(`
        INSERT INTO dbo.aptis_submissions(userId, setId, startTime, [status], attempt)
        OUTPUT INSERTED.id, INSERTED.userId, INSERTED.setId, INSERTED.startTime, INSERTED.attempt
        VALUES(@p0, @p1, SYSUTCDATETIME(), N'in_progress', @p2)
      `, [userId, setIdNum, nextAttempt]);
      res.status(201).json({ id: String(ins.recordset[0].id), attempt: ins.recordset[0].attempt });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: fromZodError(error).message });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/submissions/:id/answers", requireAuth, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const body = saveAnswerSchema.parse(req.body);
      const questionId = typeof body.questionId === 'string' ? parseInt(body.questionId, 10) : body.questionId;
      const ansJson = JSON.stringify(body.answer);
      const userId = parseInt(String(req.session.userId), 10);

      // Verify submission ownership and status
      const sub = await query(`SELECT TOP 1 userId, setId, [status], startTime FROM dbo.aptis_submissions WHERE id = @p0`, [submissionId]);
      const subRow = sub.recordset?.[0];
      if (!subRow || subRow.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
      if (subRow.status !== 'in_progress') return res.status(400).json({ error: 'Submission not in progress' });

      // Load question and mapping score
      const qres = await query(`
        SELECT q.id, q.skill, q.[type], q.answerKey, sq.score
        FROM dbo.aptis_questions q
        LEFT JOIN dbo.aptis_set_questions sq ON sq.questionId = q.id AND sq.setId = @p0
        WHERE q.id = @p1
      `, [subRow.setId, questionId]);
      const q = qres.recordset?.[0];
      if (!q) return res.status(404).json({ error: 'Question not found' });

      const weight = q.score ?? 1;
      const key = q.answerKey ? JSON.parse(q.answerKey) : null;
      const scored = autoscore(q.type, key, body.answer, weight);

      // Upsert answer
      const existing = await query(`SELECT id FROM dbo.aptis_answers WHERE submissionId = @p0 AND questionId = @p1`, [submissionId, questionId]);
      if (existing.recordset && existing.recordset.length > 0) {
        await query(`UPDATE dbo.aptis_answers SET answerData = @p0, isCorrect = @p1, score = @p2 WHERE submissionId = @p3 AND questionId = @p4`, [ansJson, scored.isCorrect, scored.score, submissionId, questionId]);
      } else {
        await query(`INSERT INTO dbo.aptis_answers(submissionId, questionId, answerData, isCorrect, score) VALUES(@p0, @p1, @p2, @p3, @p4)`, [submissionId, questionId, ansJson, scored.isCorrect, scored.score]);
      }

      // Log progress (append-only)
      await query(`INSERT INTO dbo.aptis_user_progress(submissionId, userId, setId, questionId, isCorrect, timeSpentSec, attempts)
                   VALUES(@p0, @p1, @p2, @p3, @p4, @p5, @p6)`, [submissionId, userId, subRow.setId, questionId, scored.isCorrect === null ? null : (scored.isCorrect ? 1 : 0), body.timeSpentSec ?? null, body.attempts ?? null]);

      res.status(200).json({ isCorrect: scored.isCorrect, score: scored.score });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: fromZodError(error).message });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/submissions/:id/submit", requireAuth, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const userId = parseInt(String(req.session.userId), 10);
      const sub = await query(`SELECT TOP 1 id, userId, setId, startTime FROM dbo.aptis_submissions WHERE id = @p0`, [submissionId]);
      const s = sub.recordset?.[0];
      if (!s || s.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

      const totals = await query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.aptis_set_questions WHERE setId = @p0) AS totalQuestions,
          (SELECT COUNT(*) FROM dbo.aptis_answers WHERE submissionId = @p1 AND isCorrect = 1) AS correctAnswers,
          (SELECT ISNULL(SUM(score),0) FROM dbo.aptis_answers WHERE submissionId = @p1) AS autoScore
      `, [s.setId, submissionId]);
      const t = totals.recordset?.[0] || { totalQuestions: 0, correctAnswers: 0, autoScore: 0 };

      // Duration from start to now (seconds)
      const dur = await query(`SELECT DATEDIFF(SECOND, startTime, SYSUTCDATETIME()) AS sec FROM dbo.aptis_submissions WHERE id = @p0`, [submissionId]);
      const durationSec = dur.recordset?.[0]?.sec ?? null;

      await query(`UPDATE dbo.aptis_submissions SET submitTime = SYSUTCDATETIME(), durationSec = @p0, autoScore = @p1, totalScore = @p1, [status] = N'submitted' WHERE id = @p2`, [durationSec, t.autoScore, submissionId]);

      const ins = await query(`
        INSERT INTO dbo.aptis_test_results(submissionId, userId, setId, score, totalQuestions, correctAnswers, timeSpentSec, completedAt)
        OUTPUT INSERTED.id
        VALUES(@p0, @p1, @p2, @p3, @p4, @p5, @p6, SYSUTCDATETIME())
      `, [submissionId, userId, s.setId, t.autoScore, t.totalQuestions, t.correctAnswers, durationSec]);

      res.json({ resultId: String(ins.recordset[0].id), score: t.autoScore, totalQuestions: t.totalQuestions, correctAnswers: t.correctAnswers, timeSpentSec: durationSec });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/submissions/:id", requireAuth, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const userId = parseInt(String(req.session.userId), 10);
      const sub = await query(`SELECT TOP 1 * FROM dbo.aptis_submissions WHERE id = @p0`, [submissionId]);
      const s = sub.recordset?.[0];
      if (!s || s.userId !== userId) return res.status(403).json({ error: 'Forbidden' });
      const answers = await query(`SELECT a.questionId, a.answerData, a.isCorrect, a.score FROM dbo.aptis_answers a WHERE a.submissionId = @p0`, [submissionId]);
      res.json({ submission: s, answers: answers.recordset || [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/results/me", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(String(req.session.userId), 10);
      const results = await query(`SELECT TOP 50 * FROM dbo.aptis_test_results WHERE userId = @p0 ORDER BY createdAt DESC`, [userId]);
      res.json(results.recordset || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===================== Admin: Manual Grading =====================
  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      const status = (req.query.status as string) || 'submitted';
      const skill = (req.query.skill as string) || '';
      const types = skill && skill.toLowerCase() === 'speaking' ? ['speaking_prompt'] : skill && skill.toLowerCase() === 'writing' ? ['writing_prompt'] : ['writing_prompt','speaking_prompt'];
      const r = await query(`
        SELECT s.id, s.userId, s.setId, s.startTime, s.submitTime, s.durationSec,
               (SELECT COUNT(*) FROM dbo.aptis_answers a JOIN dbo.aptis_questions q ON q.id = a.questionId WHERE a.submissionId = s.id AND q.[type] IN (${types.map((_,i)=>'@p'+i).join(',')})) AS items
        FROM dbo.aptis_submissions s
        WHERE s.[status] = @p${types.length}
          AND EXISTS (
            SELECT 1 FROM dbo.aptis_answers a
            JOIN dbo.aptis_questions q ON q.id = a.questionId
            WHERE a.submissionId = s.id AND q.[type] IN (${types.map((_,i)=>'@p'+i).join(',')})
          )
        ORDER BY s.submitTime DESC
      `, [...types, status]);
      res.json(r.recordset || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/submissions/:id/answers", requireAdmin, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const r = await query(`
        SELECT q.id AS questionId, q.title, q.skill, q.[type], q.stem, a.answerData, a.score AS currentScore
        FROM dbo.aptis_answers a
        JOIN dbo.aptis_questions q ON q.id = a.questionId
        WHERE a.submissionId = @p0 AND q.[type] IN ('writing_prompt','speaking_prompt')
        ORDER BY q.id
      `, [submissionId]);
      res.json(r.recordset || []);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const gradeSchema = z.object({
    submissionId: z.union([z.string(), z.number()]),
    questionId: z.union([z.string(), z.number()]),
    manualScore: z.number().nonnegative(),
    comment: z.string().optional(),
    rubricId: z.union([z.string(), z.number()]).optional(),
    scores: z.any().optional(),
  });

  app.post("/api/admin/grade", requireAdmin, async (req, res) => {
    try {
      const body = gradeSchema.parse(req.body);
      const submissionId = typeof body.submissionId === 'string' ? parseInt(body.submissionId, 10) : body.submissionId;
      const questionId = typeof body.questionId === 'string' ? parseInt(body.questionId, 10) : body.questionId;
      const scoresJson = body.scores ? JSON.stringify(body.scores) : null;
      // Upsert manual grading entry
      const exists = await query(`SELECT TOP 1 id FROM dbo.aptis_manual_grading WHERE submissionId = @p0 AND questionId = @p1`, [submissionId, questionId]);
      if (exists.recordset && exists.recordset.length > 0) {
        await query(`UPDATE dbo.aptis_manual_grading SET scores = @p0, comment = @p1, rubricId = @p2, gradedAt = SYSUTCDATETIME() WHERE submissionId = @p3 AND questionId = @p4`, [scoresJson, body.comment ?? null, body.rubricId ?? null, submissionId, questionId]);
      } else {
        await query(`INSERT INTO dbo.aptis_manual_grading(submissionId, questionId, rubricId, scores, comment, gradedAt) VALUES(@p0, @p1, @p2, @p3, @p4, SYSUTCDATETIME())`, [submissionId, questionId, body.rubricId ?? null, scoresJson, body.comment ?? null]);
      }
      // Update answer score to manual score
      await query(`UPDATE dbo.aptis_answers SET score = @p0 WHERE submissionId = @p1 AND questionId = @p2`, [body.manualScore, submissionId, questionId]);
      res.json({ message: 'graded' });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: fromZodError(error).message });
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/submissions/:id/complete", requireAdmin, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const sub = await query(`SELECT TOP 1 id, userId, setId FROM dbo.aptis_submissions WHERE id = @p0`, [submissionId]);
      const s = sub.recordset?.[0];
      if (!s) return res.status(404).json({ error: 'Submission not found' });
      const totals = await query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.aptis_set_questions WHERE setId = @p0) AS totalQuestions,
          (SELECT COUNT(*) FROM dbo.aptis_answers WHERE submissionId = @p1 AND isCorrect = 1) AS correctAnswers,
          (SELECT ISNULL(SUM(score),0) FROM dbo.aptis_answers WHERE submissionId = @p1) AS totalScore
      `, [s.setId, submissionId]);
      const t = totals.recordset?.[0] || { totalQuestions: 0, correctAnswers: 0, totalScore: 0 };
      await query(`UPDATE dbo.aptis_submissions SET [status] = N'graded', totalScore = @p0 WHERE id = @p1`, [t.totalScore, submissionId]);
      const existing = await query(`SELECT TOP 1 id FROM dbo.aptis_test_results WHERE submissionId = @p0`, [submissionId]);
      if (existing.recordset && existing.recordset.length > 0) {
        await query(`UPDATE dbo.aptis_test_results SET score = @p0, totalQuestions = @p1, correctAnswers = @p2, completedAt = SYSUTCDATETIME() WHERE submissionId = @p3`, [t.totalScore, t.totalQuestions, t.correctAnswers, submissionId]);
      } else {
        await query(`INSERT INTO dbo.aptis_test_results(submissionId, userId, setId, score, totalQuestions, correctAnswers, timeSpentSec, completedAt) VALUES(@p0, @p1, @p2, @p3, @p4, @p5, NULL, SYSUTCDATETIME())`, [submissionId, s.userId, s.setId, t.totalScore, t.totalQuestions, t.correctAnswers]);
      }
      res.json({ message: 'completed', totalScore: t.totalScore });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  function autoscore(type: string, key: any, answer: any, weight: number): { isCorrect: boolean | null, score: number | null } {
    const t = (type || '').toLowerCase();
    try {
      if (t === 'mcq_single') {
        if (!key) return { isCorrect: null, score: null };
        const correct = Array.isArray(key) ? String(key[0]) : String(key);
        const ans = answer == null ? '' : String(answer);
        const ok = normalize(ans) === normalize(correct);
        return { isCorrect: ok, score: ok ? weight : 0 };
      }
      if (t === 'mcq_multi') {
        if (!Array.isArray(key)) return { isCorrect: null, score: null };
        const ansArr = Array.isArray(answer) ? answer.map(String) : [];
        const ok = setEqual(new Set(key.map(String).map(normalize)), new Set(ansArr.map(normalize)));
        return { isCorrect: ok, score: ok ? weight : 0 };
      }
      if (t === 'fill_blank') {
        if (!key) return { isCorrect: null, score: null };
        const keys = Array.isArray(key) ? key : [key];
        const ans = answer == null ? '' : String(answer);
        const ok = keys.map((k:any)=>normalize(String(k))).includes(normalize(ans));
        return { isCorrect: ok, score: ok ? weight : 0 };
      }
      // Writing/Speaking prompts -> manual grading
      return { isCorrect: null, score: null };
    } catch {
      return { isCorrect: null, score: null };
    }
  }
  function normalize(s: string): string { return s.trim().toLowerCase(); }
  function setEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    let ok = true;
    a.forEach((x) => { if (!b.has(x)) ok = false; });
    return ok;
  }

  // ===================== Admin: Media Upload & Attach =====================
  app.post('/api/admin/media/upload', requireAdmin, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const { originalname, mimetype, filename, size } = req.file;
      const safe = originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const generatedName = `${Date.now()}_${safe}`;
      const type = mimetype.startsWith('audio')
        ? 'audio'
        : mimetype.startsWith('image')
          ? 'image'
          : mimetype.startsWith('video')
            ? 'video'
            : mimetype === 'application/pdf'
              ? 'pdf'
              : 'file';

      let url: string;
      let r2Key: string | undefined;
      if (isR2Enabled) {
        if (!req.file.buffer) throw new Error("Upload buffer missing");
        r2Key = buildR2Key(originalname, mimetype);
        await uploadBufferToR2({
          key: r2Key,
          body: req.file.buffer,
          contentType: mimetype,
        });
        url = getR2PublicUrl(r2Key);
      } else {
        url = resolvePublicUrl(req, `/uploads/${filename}`);
      }

      if (process.env.DATABASE_URL) {
        const ins = await query(
          `INSERT INTO dbo.aptis_media(name, [type], url, [size]) OUTPUT INSERTED.id VALUES(@p0, @p1, @p2, @p3)`,
          [originalname, type, url, size],
        );
        return res.status(201).json({ id: String(ins.recordset[0].id), filename: originalname, type, url, size });
      } else {
        const fallbackId = isR2Enabled && r2Key ? r2Key : filename;
        return res.status(201).json({ id: fallbackId, filename: originalname, type, url, size });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/questions/:id/media', requireAdmin, async (req, res) => {
    try {
      const qid = parseInt(req.params.id, 10);
      const { mediaId } = req.body as any;
      if (!mediaId) return res.status(400).json({ error: 'mediaId required' });
      if (process.env.DATABASE_URL) {
        await query(`UPDATE dbo.aptis_questions SET mediaId = @p0 WHERE id = @p1`, [parseInt(mediaId, 10), qid]);
        return res.json({ message: 'attached' });
      } else {
        return res.json({ message: 'noop (memory mode)' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
