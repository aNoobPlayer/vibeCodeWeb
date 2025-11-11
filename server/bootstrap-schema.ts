import { query } from "./db";

type TableDefinition = {
  name: string;
  createSql: string;
};

const tables: TableDefinition[] = [
  {
    name: "aptis_users",
    createSql: `
      IF OBJECT_ID('dbo.aptis_users', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_users (
          id           INT IDENTITY(1,1) PRIMARY KEY,
          email        NVARCHAR(255) NOT NULL UNIQUE,
          passwordHash NVARCHAR(255) NOT NULL,
          name         NVARCHAR(150) NOT NULL,
          role         NVARCHAR(20)  NOT NULL DEFAULT N'student',
          avatar       NVARCHAR(10)  NULL,
          isActive     BIT NOT NULL DEFAULT(1),
          createdAt    DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          lastLogin    DATETIME2(3) NULL,
          CONSTRAINT CK_users_role CHECK (role IN (N'student', N'admin'))
        );
      END
    `,
  },
  {
    name: "aptis_settings",
    createSql: `
      IF OBJECT_ID('dbo.aptis_settings', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_settings (
          id            INT IDENTITY(1,1) PRIMARY KEY,
          defaultTime   INT         NOT NULL DEFAULT(45),
          shuffle       BIT         NOT NULL DEFAULT(0),
          allowReview   BIT         NOT NULL DEFAULT(1),
          theme         NVARCHAR(20) NOT NULL DEFAULT N'light',
          language      NVARCHAR(10) NOT NULL DEFAULT N'vi',
          notifications BIT        NOT NULL DEFAULT(1),
          autoSave      BIT         NOT NULL DEFAULT(1),
          updatedAt     DATETIME2(3) NULL
        );
      END
    `,
  },
  {
    name: "aptis_audit_logs",
    createSql: `
      IF OBJECT_ID('dbo.aptis_audit_logs', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_audit_logs (
          id         BIGINT IDENTITY(1,1) PRIMARY KEY,
          userId     INT NULL,
          action     NVARCHAR(100) NOT NULL,
          details    NVARCHAR(MAX) NULL,
          createdAt  DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT FK_audit_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_media",
    createSql: `
      IF OBJECT_ID('dbo.aptis_media', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_media (
          id         INT IDENTITY(1,1) PRIMARY KEY,
          name       NVARCHAR(255) NOT NULL,
          [type]     NVARCHAR(30)  NOT NULL,
          [size]     BIGINT        NULL,
          url        NVARCHAR(1000) NOT NULL,
          duration   INT           NULL,
          uploaderId INT           NULL,
          createdAt  DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT CK_media_type CHECK ([type] IN (N'audio', N'image', N'video')),
          CONSTRAINT FK_media_uploader FOREIGN KEY (uploaderId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_tips",
    createSql: `
      IF OBJECT_ID('dbo.aptis_tips', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_tips (
          id        INT IDENTITY(1,1) PRIMARY KEY,
          title     NVARCHAR(255) NOT NULL,
          skill     NVARCHAR(50)  NOT NULL,
          content   NVARCHAR(MAX) NOT NULL,
          [status]  NVARCHAR(20)  NOT NULL DEFAULT N'published',
          priority  NVARCHAR(20)  NOT NULL DEFAULT N'medium',
          authorId  INT           NULL,
          createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
          updatedAt DATETIME2(3)  NULL,
          CONSTRAINT CK_tips_skill CHECK (skill IN (N'Reading',N'Listening',N'Writing',N'Speaking',N'GrammarVocabulary')),
          CONSTRAINT CK_tips_status CHECK ([status] IN (N'published',N'draft')),
          CONSTRAINT CK_tips_priority CHECK (priority IN (N'high',N'medium',N'low')),
          CONSTRAINT FK_tips_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_rubrics",
    createSql: `
      IF OBJECT_ID('dbo.aptis_rubrics', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_rubrics (
          id        INT IDENTITY(1,1) PRIMARY KEY,
          title     NVARCHAR(200) NOT NULL,
          skill     NVARCHAR(50)  NOT NULL,
          criteria  NVARCHAR(MAX) NOT NULL,
          createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
          updatedAt DATETIME2(3)  NULL,
          CONSTRAINT CK_rubric_skill CHECK (skill IN (N'Writing',N'Speaking'))
        );
      END
    `,
  },
  {
    name: "aptis_sets",
    createSql: `
      IF OBJECT_ID('dbo.aptis_sets', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_sets (
          id          INT IDENTITY(1,1) PRIMARY KEY,
          name        NVARCHAR(255) NOT NULL,
          [description] NVARCHAR(1000) NULL,
          level       NVARCHAR(10)  NULL,
          timeLimit   INT           NOT NULL DEFAULT(60),
          [status]    NVARCHAR(20)  NOT NULL DEFAULT N'published',
          skill       NVARCHAR(50)  NOT NULL DEFAULT N'General',
          authorId    INT           NULL,
          createdAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
          updatedAt   DATETIME2(3)  NULL,
          CONSTRAINT CK_sets_status CHECK ([status] IN (N'published',N'draft')),
          CONSTRAINT FK_sets_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_sets_skill_column",
    createSql: `
      IF OBJECT_ID('dbo.aptis_sets', 'U') IS NOT NULL AND COL_LENGTH('dbo.aptis_sets', 'skill') IS NULL
      BEGIN
        ALTER TABLE dbo.aptis_sets
        ADD skill NVARCHAR(50) NOT NULL CONSTRAINT DF_aptis_sets_skill DEFAULT N'General';
      END
    `,
  },
  {
    name: "aptis_questions",
    createSql: `
      IF OBJECT_ID('dbo.aptis_questions', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_questions (
          id          INT IDENTITY(1,1) PRIMARY KEY,
          title       NVARCHAR(255) NULL,
          skill       NVARCHAR(50)  NOT NULL,
          [type]      NVARCHAR(50)  NOT NULL,
          stem        NVARCHAR(MAX) NOT NULL,
          optionsJson NVARCHAR(MAX) NULL,
          answerKey   NVARCHAR(MAX) NULL,
          explain     NVARCHAR(MAX) NULL,
          difficulty  NVARCHAR(20)  NULL,
          mediaId     INT           NULL,
          authorId    INT           NULL,
          createdAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
          updatedAt   DATETIME2(3)  NULL,
          CONSTRAINT CK_q_skill CHECK (skill IN (N'Reading',N'Listening',N'Writing',N'Speaking',N'GrammarVocabulary')),
          CONSTRAINT CK_q_type  CHECK ([type] IN (N'mcq_single',N'mcq_multi',N'fill_blank',N'writing_prompt',N'speaking_prompt')),
          CONSTRAINT FK_q_media FOREIGN KEY (mediaId) REFERENCES dbo.aptis_media(id) ON DELETE NO ACTION,
          CONSTRAINT FK_q_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_set_questions",
    createSql: `
      IF OBJECT_ID('dbo.aptis_set_questions', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_set_questions (
          setId      INT NOT NULL,
          questionId INT NOT NULL,
          [section]  NVARCHAR(50) NOT NULL,
          [order]    INT NOT NULL DEFAULT(1),
          score      FLOAT NULL,
          mediaId    INT NULL,
          CONSTRAINT PK_set_questions PRIMARY KEY (setId, questionId),
          CONSTRAINT FK_sq_set FOREIGN KEY (setId) REFERENCES dbo.aptis_sets(id) ON DELETE CASCADE,
          CONSTRAINT FK_sq_question FOREIGN KEY (questionId) REFERENCES dbo.aptis_questions(id) ON DELETE NO ACTION,
          CONSTRAINT FK_sq_media FOREIGN KEY (mediaId) REFERENCES dbo.aptis_media(id) ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_submissions",
    createSql: `
      IF OBJECT_ID('dbo.aptis_submissions', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_submissions (
          id          BIGINT IDENTITY(1,1) PRIMARY KEY,
          userId      INT NOT NULL,
          setId       INT NOT NULL,
          startTime   DATETIME2(3) NULL,
          submitTime  DATETIME2(3) NULL,
          durationSec INT NULL,
          autoScore   FLOAT NULL,
          manualScore FLOAT NULL,
          totalScore  FLOAT NULL,
          [status]    NVARCHAR(20) NOT NULL DEFAULT N'submitted',
          attempt     INT NOT NULL DEFAULT(1),
          createdAt   DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT CK_submission_status CHECK ([status] IN (N'in_progress',N'submitted',N'graded')),
          CONSTRAINT FK_sub_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION,
          CONSTRAINT FK_sub_set  FOREIGN KEY (setId)  REFERENCES dbo.aptis_sets(id)  ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_answers",
    createSql: `
      IF OBJECT_ID('dbo.aptis_answers', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_answers (
          id            BIGINT IDENTITY(1,1) PRIMARY KEY,
          submissionId  BIGINT NOT NULL,
          questionId    INT    NOT NULL,
          answerData    NVARCHAR(MAX) NULL,
          isCorrect     BIT NULL,
          score         FLOAT NULL,
          createdAt     DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT FK_ans_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
          CONSTRAINT FK_ans_question   FOREIGN KEY (questionId)   REFERENCES dbo.aptis_questions(id)  ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_manual_grading",
    createSql: `
      IF OBJECT_ID('dbo.aptis_manual_grading', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_manual_grading (
          id           BIGINT IDENTITY(1,1) PRIMARY KEY,
          submissionId BIGINT NOT NULL,
          questionId   INT    NOT NULL,
          rubricId     INT    NULL,
          scores       NVARCHAR(MAX) NULL,
          comment      NVARCHAR(MAX) NULL,
          gradedBy     INT    NULL,
          gradedAt     DATETIME2(3) NULL,
          CONSTRAINT FK_mg_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
          CONSTRAINT FK_mg_question   FOREIGN KEY (questionId)   REFERENCES dbo.aptis_questions(id)  ON DELETE NO ACTION,
          CONSTRAINT FK_mg_rubric     FOREIGN KEY (rubricId)     REFERENCES dbo.aptis_rubrics(id)    ON DELETE NO ACTION,
          CONSTRAINT FK_mg_grader     FOREIGN KEY (gradedBy)     REFERENCES dbo.aptis_users(id)      ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_test_results",
    createSql: `
      IF OBJECT_ID('dbo.aptis_test_results', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_test_results (
          id              BIGINT IDENTITY(1,1) PRIMARY KEY,
          submissionId    BIGINT NOT NULL,
          userId          INT NOT NULL,
          setId           INT NOT NULL,
          score           FLOAT NULL,
          totalQuestions  INT   NULL,
          correctAnswers  INT   NULL,
          timeSpentSec    INT   NULL,
          completedAt     DATETIME2(3) NULL,
          createdAt       DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT FK_tr_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
          CONSTRAINT FK_tr_user       FOREIGN KEY (userId)       REFERENCES dbo.aptis_users(id)       ON DELETE NO ACTION,
          CONSTRAINT FK_tr_set        FOREIGN KEY (setId)        REFERENCES dbo.aptis_sets(id)        ON DELETE NO ACTION
        );
      END
    `,
  },
  {
    name: "aptis_user_progress",
    createSql: `
      IF OBJECT_ID('dbo.aptis_user_progress', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.aptis_user_progress (
          id           BIGINT IDENTITY(1,1) PRIMARY KEY,
          submissionId BIGINT NOT NULL,
          userId       INT NOT NULL,
          setId        INT NOT NULL,
          questionId   INT NOT NULL,
          isCorrect    BIT NULL,
          timeSpentSec INT NULL,
          attempts     INT NULL,
          createdAt    DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
          CONSTRAINT FK_up_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
          CONSTRAINT FK_up_user       FOREIGN KEY (userId)       REFERENCES dbo.aptis_users(id)       ON DELETE NO ACTION,
          CONSTRAINT FK_up_set        FOREIGN KEY (setId)        REFERENCES dbo.aptis_sets(id)        ON DELETE NO ACTION,
          CONSTRAINT FK_up_question   FOREIGN KEY (questionId)   REFERENCES dbo.aptis_questions(id)   ON DELETE NO ACTION
        );
      END
    `,
  },
];

const indexes = [
  {
    name: "IX_questions_skill_type",
    createSql: `CREATE INDEX IX_questions_skill_type ON dbo.aptis_questions(skill, [type]);`,
    table: "dbo.aptis_questions",
  },
  {
    name: "IX_set_questions_set_section_ord",
    createSql: `CREATE INDEX IX_set_questions_set_section_ord ON dbo.aptis_set_questions(setId, [section], [order]);`,
    table: "dbo.aptis_set_questions",
  },
  {
    name: "IX_submissions_user",
    createSql: `CREATE INDEX IX_submissions_user ON dbo.aptis_submissions(userId);`,
    table: "dbo.aptis_submissions",
  },
  {
    name: "IX_submissions_set",
    createSql: `CREATE INDEX IX_submissions_set ON dbo.aptis_submissions(setId);`,
    table: "dbo.aptis_submissions",
  },
  {
    name: "IX_answers_submission",
    createSql: `CREATE INDEX IX_answers_submission ON dbo.aptis_answers(submissionId);`,
    table: "dbo.aptis_answers",
  },
  {
    name: "IX_answers_question",
    createSql: `CREATE INDEX IX_answers_question ON dbo.aptis_answers(questionId);`,
    table: "dbo.aptis_answers",
  },
  {
    name: "IX_tr_user_set",
    createSql: `CREATE INDEX IX_tr_user_set ON dbo.aptis_test_results(userId, setId);`,
    table: "dbo.aptis_test_results",
  },
  {
    name: "IX_up_user_set_q",
    createSql: `CREATE INDEX IX_up_user_set_q ON dbo.aptis_user_progress(userId, setId, questionId);`,
    table: "dbo.aptis_user_progress",
  },
];

async function tableExists(tableName: string) {
  const result = await query(
    `SELECT 1 AS ok
     FROM sys.tables t
     JOIN sys.schemas s ON t.schema_id = s.schema_id
     WHERE s.name = N'dbo' AND t.name = @p0`,
    [tableName]
  );
  return result.recordset.length > 0;
}

async function indexExists(indexName: string, tableName: string) {
  const result = await query(
    `SELECT 1 AS ok
     FROM sys.indexes
     WHERE name = @p0 AND object_id = OBJECT_ID(@p1)`,
    [indexName, tableName]
  );
  return result.recordset.length > 0;
}

async function ensureDefaultSettingsRow() {
  const result = await query(`SELECT COUNT(*) AS c FROM dbo.aptis_settings`);
  const count = result.recordset?.[0]?.c ?? 0;
  if (count === 0) {
    await query(
      `INSERT INTO dbo.aptis_settings (defaultTime, shuffle, allowReview, theme, language, notifications, autoSave)
       VALUES (45, 0, 1, N'light', N'vi', 1, 1)`
    );
  }
}

export async function ensureSqlSchema() {
  for (const table of tables) {
    // Simple dependency ordering: required tables are declared earlier.
    if (await tableExists(table.name)) continue;
    await query(table.createSql);
  }

  for (const index of indexes) {
    if (await indexExists(index.name, index.table)) continue;
    await query(index.createSql);
  }

  await ensureDefaultSettingsRow();
}
