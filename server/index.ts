import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import { query } from "./db";

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    role?: string;
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "aptis-keys-secret-development-only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Serve file uploads
const uploadsDir = path.resolve(import.meta.dirname, '..', 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Dev bootstrap: ensure at least one admin exists in SQL mode
  try {
    if (process.env.DATABASE_URL) {
      const r = await query("SELECT COUNT(*) AS c FROM dbo.aptis_users");
      const count = r.recordset?.[0]?.c ?? 0;
      if (count === 0) {
        await query("INSERT INTO dbo.aptis_users (email, passwordHash, name, role) VALUES (@p0,@p1,@p2,@p3)", [
          'admin@example.com', 'admin123', 'admin', 'admin',
        ]);
        await query("INSERT INTO dbo.aptis_users (email, passwordHash, name, role) VALUES (@p0,@p1,@p2,@p3)", [
          'student@example.com', 'student123', 'student', 'student',
        ]);
        log('Seeded default users: admin@example.com/admin123, student@example.com/student123', 'bootstrap');
      }
    }
  } catch (e) {
    log(`Bootstrap users failed: ${String((e as any)?.message || e)}`, 'bootstrap');
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "localhost", () => {
    log(`serving on http://localhost:${port}`);
  });
})();
