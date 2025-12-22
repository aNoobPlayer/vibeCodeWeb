-- ===== APTIS KEYS SCHEMA (SQL Server) =====
-- Lưu ý:
-- - Tránh multiple cascade paths: chỉ CASCADE theo submissionId xuống các bảng chi tiết.
-- - Các FK userId/setId/questionId dùng NO ACTION.
-- - Rubrics tạo TRƯỚC manual_grading.

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ========== DROP TABLES (nếu cần chạy lại) ========== */
IF OBJECT_ID('dbo.aptis_manual_grading','U') IS NOT NULL DROP TABLE dbo.aptis_manual_grading;
IF OBJECT_ID('dbo.aptis_answers','U') IS NOT NULL DROP TABLE dbo.aptis_answers;
IF OBJECT_ID('dbo.aptis_test_results','U') IS NOT NULL DROP TABLE dbo.aptis_test_results;
IF OBJECT_ID('dbo.aptis_user_progress','U') IS NOT NULL DROP TABLE dbo.aptis_user_progress;
IF OBJECT_ID('dbo.aptis_submissions','U') IS NOT NULL DROP TABLE dbo.aptis_submissions;
IF OBJECT_ID('dbo.aptis_set_questions','U') IS NOT NULL DROP TABLE dbo.aptis_set_questions;
IF OBJECT_ID('dbo.aptis_questions','U') IS NOT NULL DROP TABLE dbo.aptis_questions;
IF OBJECT_ID('dbo.aptis_sets','U') IS NOT NULL DROP TABLE dbo.aptis_sets;
IF OBJECT_ID('dbo.aptis_rubrics','U') IS NOT NULL DROP TABLE dbo.aptis_rubrics;
IF OBJECT_ID('dbo.aptis_media','U') IS NOT NULL DROP TABLE dbo.aptis_media;
IF OBJECT_ID('dbo.aptis_tips','U') IS NOT NULL DROP TABLE dbo.aptis_tips;
IF OBJECT_ID('dbo.aptis_lessons','U') IS NOT NULL DROP TABLE dbo.aptis_lessons;
IF OBJECT_ID('dbo.aptis_notifications','U') IS NOT NULL DROP TABLE dbo.aptis_notifications;
IF OBJECT_ID('dbo.aptis_settings','U') IS NOT NULL DROP TABLE dbo.aptis_settings;
IF OBJECT_ID('dbo.aptis_class_members','U') IS NOT NULL DROP TABLE dbo.aptis_class_members;
IF OBJECT_ID('dbo.aptis_classes','U') IS NOT NULL DROP TABLE dbo.aptis_classes;
IF OBJECT_ID('dbo.aptis_audit_logs','U') IS NOT NULL DROP TABLE dbo.aptis_audit_logs;
IF OBJECT_ID('dbo.aptis_users','U') IS NOT NULL DROP TABLE dbo.aptis_users;
GO

/* ========== USERS ========== */
CREATE TABLE dbo.aptis_users (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  email        NVARCHAR(255) NOT NULL UNIQUE,
  passwordHash NVARCHAR(255) NOT NULL,
  name         NVARCHAR(150) NOT NULL,
  role         NVARCHAR(20)  NOT NULL DEFAULT N'student', -- 'student' | 'admin'
  avatar       NVARCHAR(10)  NULL,
  isActive     BIT NOT NULL DEFAULT(1),
  createdAt    DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  lastLogin    DATETIME2(3) NULL,
  CONSTRAINT CK_users_role CHECK (role IN (N'student', N'admin'))
);
GO

/* ========== SETTINGS (tùy chọn hệ thống) ========== */
CREATE TABLE dbo.aptis_settings (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  defaultTime  INT         NOT NULL DEFAULT(45),   -- phút
  shuffle      BIT         NOT NULL DEFAULT(0),
  allowReview  BIT         NOT NULL DEFAULT(1),
  theme        NVARCHAR(20) NOT NULL DEFAULT N'light',
  language     NVARCHAR(10) NOT NULL DEFAULT N'vi',
  notifications BIT        NOT NULL DEFAULT(1),
  autoSave     BIT         NOT NULL DEFAULT(1),
  updatedAt    DATETIME2(3) NULL
);
GO

/* ========== AUDIT LOGS (theo dõi hoạt động) ========== */
CREATE TABLE dbo.aptis_audit_logs (
  id         BIGINT IDENTITY(1,1) PRIMARY KEY,
  userId     INT NULL,
  action     NVARCHAR(100) NOT NULL,
  details    NVARCHAR(MAX) NULL,
  createdAt  DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_audit_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO
--Phần 2/6 — Media, Tips, Notifications, Classes
/* ========== MEDIA (file audio/image/video) ========== */
CREATE TABLE dbo.aptis_media (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  name      NVARCHAR(255) NOT NULL,
  [type]    NVARCHAR(30)  NOT NULL, -- 'audio' | 'image' | 'video'
  [size]    BIGINT        NULL,
  url       NVARCHAR(1000) NOT NULL,
  duration  INT           NULL, -- giây
  uploaderId INT          NULL,
  createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_media_type CHECK ([type] IN (N'audio', N'image', N'video')),
  CONSTRAINT FK_media_uploader FOREIGN KEY (uploaderId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== TIPS (mẹo/ hướng dẫn) ========== */
CREATE TABLE dbo.aptis_tips (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  title     NVARCHAR(255) NOT NULL,
  skill     NVARCHAR(50)  NOT NULL, -- Reading/Listening/Writing/Speaking/GrammarVocabulary
  content   NVARCHAR(MAX) NOT NULL,
  [status]  NVARCHAR(20)  NOT NULL DEFAULT N'published', -- published/draft
  priority  NVARCHAR(20)  NOT NULL DEFAULT N'medium',    -- high/medium/low
  authorId  INT           NULL,
  createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2(3)  NULL,
  CONSTRAINT CK_tips_skill CHECK (skill IN (N'Reading',N'Listening',N'Writing',N'Speaking',N'GrammarVocabulary')),
  CONSTRAINT CK_tips_status CHECK ([status] IN (N'published',N'draft')),
  CONSTRAINT CK_tips_priority CHECK (priority IN (N'high',N'medium',N'low')),
  CONSTRAINT FK_tips_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== LESSONS (lesson content) ========== */
CREATE TABLE dbo.aptis_lessons (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  title     NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(1000) NULL,
  skill     NVARCHAR(50)  NOT NULL, -- Reading/Listening/Writing/Speaking/GrammarVocabulary/General
  content   NVARCHAR(MAX) NOT NULL,
  outcomesJson NVARCHAR(MAX) NULL,
  keyPointsJson NVARCHAR(MAX) NULL,
  practicePromptsJson NVARCHAR(MAX) NULL,
  [status]  NVARCHAR(20)  NOT NULL DEFAULT N'draft', -- published/draft
  testSetId INT           NULL,
  courseId  INT           NULL,
  [level]   INT           NOT NULL DEFAULT(1),
  durationMinutes INT     NULL,
  orderIndex INT          NULL,
  coverImageUrl NVARCHAR(1000) NULL,
  youtubeUrl NVARCHAR(1000) NULL,
  authorId  INT           NULL,
  createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2(3)  NULL,
  CONSTRAINT CK_lessons_skill CHECK (skill IN (N'Reading',N'Listening',N'Writing',N'Speaking',N'GrammarVocabulary',N'General')),
  CONSTRAINT CK_lessons_status CHECK ([status] IN (N'published',N'draft')),
  CONSTRAINT FK_lessons_set FOREIGN KEY (testSetId) REFERENCES dbo.aptis_sets(id) ON DELETE NO ACTION,
  CONSTRAINT FK_lessons_course FOREIGN KEY (courseId) REFERENCES dbo.aptis_classes(id) ON DELETE NO ACTION,
  CONSTRAINT FK_lessons_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== NOTIFICATIONS (thông báo) ========== */
CREATE TABLE dbo.aptis_notifications (
  id        BIGINT IDENTITY(1,1) PRIMARY KEY,
  userId    INT NOT NULL,
  [type]    NVARCHAR(20) NOT NULL DEFAULT N'info', -- success/error/info/warning
  title     NVARCHAR(255) NOT NULL,
  [message] NVARCHAR(MAX) NOT NULL,
  isRead    BIT NOT NULL DEFAULT(0),
  createdAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_notif_type CHECK ([type] IN (N'success',N'error',N'info',N'warning')),
  CONSTRAINT FK_notif_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== CLASSES (nhóm/lớp) & MEMBERS (tuỳ chọn) ========== */
CREATE TABLE dbo.aptis_classes (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  code      NVARCHAR(50) NOT NULL UNIQUE,
  name      NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(1000) NULL,
  [status]  NVARCHAR(20) NOT NULL DEFAULT N'open', -- open/closed
  passThreshold INT NOT NULL DEFAULT(80),
  createdBy INT NULL,
  createdAt DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_classes_status CHECK ([status] IN (N'open', N'closed')),
  CONSTRAINT FK_classes_creator FOREIGN KEY (createdBy) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

CREATE TABLE dbo.aptis_class_members (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  classId   INT NOT NULL,
  userId    INT NOT NULL,
  roleInClass NVARCHAR(20) NOT NULL DEFAULT N'student',
  [status]  NVARCHAR(20) NOT NULL DEFAULT N'pending', -- pending/approved/rejected
  joinedAt  DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_class_member UNIQUE (classId, userId),
  CONSTRAINT CK_class_members_status CHECK ([status] IN (N'pending', N'approved', N'rejected')),
  CONSTRAINT FK_class_members_class FOREIGN KEY (classId) REFERENCES dbo.aptis_classes(id) ON DELETE CASCADE,
  CONSTRAINT FK_class_members_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO
--Phần 3/6 — Sets, Questions, Set_Questions, Rubrics
/* ========== SETS (bộ đề) ========== */
CREATE TABLE dbo.aptis_sets (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(255) NOT NULL,
  [description] NVARCHAR(1000) NULL,
  level       NVARCHAR(10)  NULL,  -- A2/B1/B2/C...
  timeLimit   INT           NOT NULL DEFAULT(60), -- phút
  [status]    NVARCHAR(20)  NOT NULL DEFAULT N'published', -- published/draft
  authorId    INT           NULL,
  createdAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt   DATETIME2(3)  NULL,
  CONSTRAINT CK_sets_status CHECK ([status] IN (N'published',N'draft')),
  CONSTRAINT FK_sets_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== QUESTIONS (ngân hàng câu hỏi) ========== */
CREATE TABLE dbo.aptis_questions (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  title       NVARCHAR(255) NULL,
  skill       NVARCHAR(50)  NOT NULL, -- Reading/Listening/Writing/Speaking/GrammarVocabulary
  [type]      NVARCHAR(50)  NOT NULL, -- mcq_single/mcq_multi/fill_blank/writing_prompt/speaking_prompt
  stem        NVARCHAR(MAX) NOT NULL, -- nội dung câu hỏi
  optionsJson NVARCHAR(MAX) NULL,     -- JSON cho phương án (trắc nghiệm)
  answerKey   NVARCHAR(MAX) NULL,     -- đáp án đúng (nếu cần)
  explain     NVARCHAR(MAX) NULL,     -- giải thích
  difficulty  NVARCHAR(20)  NULL,     -- easy/medium/hard
  mediaId     INT           NULL,     -- audio/image/video kèm
  authorId    INT           NULL,
  createdAt   DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt   DATETIME2(3)  NULL,
  CONSTRAINT CK_q_skill CHECK (skill IN (N'Reading',N'Listening',N'Writing',N'Speaking',N'GrammarVocabulary')),
  CONSTRAINT CK_q_type  CHECK ([type] IN (N'mcq_single',N'mcq_multi',N'fill_blank',N'writing_prompt',N'speaking_prompt')),
  CONSTRAINT FK_q_media FOREIGN KEY (mediaId) REFERENCES dbo.aptis_media(id) ON DELETE NO ACTION,
  CONSTRAINT FK_q_author FOREIGN KEY (authorId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION
);
GO

/* ========== SET_QUESTIONS (gán câu hỏi vào đề) ========== */
CREATE TABLE dbo.aptis_set_questions (
  setId      INT NOT NULL,
  questionId INT NOT NULL,
  [section]  NVARCHAR(50) NOT NULL, -- GrammarVocabulary/Reading/Listening/Writing/Speaking
  [order]    INT NOT NULL DEFAULT(1),
  score      FLOAT NULL,
  mediaId    INT NULL, -- media override nếu cần
  CONSTRAINT PK_set_questions PRIMARY KEY (setId, questionId),
  CONSTRAINT FK_sq_set FOREIGN KEY (setId) REFERENCES dbo.aptis_sets(id) ON DELETE CASCADE,
  CONSTRAINT FK_sq_question FOREIGN KEY (questionId) REFERENCES dbo.aptis_questions(id) ON DELETE NO ACTION,
  CONSTRAINT FK_sq_media FOREIGN KEY (mediaId) REFERENCES dbo.aptis_media(id) ON DELETE NO ACTION
);
GO

/* ========== RUBRICS (tiêu chí chấm) ========== */
CREATE TABLE dbo.aptis_rubrics (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  title     NVARCHAR(200) NOT NULL,
  skill     NVARCHAR(50)  NOT NULL, -- Writing/Speaking
  criteria  NVARCHAR(MAX) NOT NULL, -- JSON tiêu chí
  createdAt DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
  updatedAt DATETIME2(3)  NULL,
  CONSTRAINT CK_rubric_skill CHECK (skill IN (N'Writing',N'Speaking'))
);
GO
--Phần 4/6 — Submissions & Answers
/* ========== SUBMISSIONS (bài làm) ========== */
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
  [status]    NVARCHAR(20) NOT NULL DEFAULT N'submitted', -- in_progress/submitted/graded
  attempt     INT NOT NULL DEFAULT(1),
  createdAt   DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT CK_submission_status CHECK ([status] IN (N'in_progress',N'submitted',N'graded')),
  CONSTRAINT FK_sub_user FOREIGN KEY (userId) REFERENCES dbo.aptis_users(id) ON DELETE NO ACTION,
  CONSTRAINT FK_sub_set  FOREIGN KEY (setId)  REFERENCES dbo.aptis_sets(id)  ON DELETE NO ACTION
);
GO

/* ========== ANSWERS (chi tiết câu trả lời) ========== */
CREATE TABLE dbo.aptis_answers (
  id            BIGINT IDENTITY(1,1) PRIMARY KEY,
  submissionId  BIGINT NOT NULL,
  questionId    INT    NOT NULL,
  answerData    NVARCHAR(MAX) NULL,  -- JSON/text; nếu Speaking có thể là link file
  isCorrect     BIT NULL,
  score         FLOAT NULL,
  createdAt     DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_ans_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
  CONSTRAINT FK_ans_question   FOREIGN KEY (questionId)   REFERENCES dbo.aptis_questions(id)  ON DELETE NO ACTION
);
GO

/* Chỉ mục hữu ích */
CREATE INDEX IX_submissions_user ON dbo.aptis_submissions(userId);
CREATE INDEX IX_submissions_set  ON dbo.aptis_submissions(setId);
CREATE INDEX IX_answers_submission ON dbo.aptis_answers(submissionId);
CREATE INDEX IX_answers_question   ON dbo.aptis_answers(questionId);
GO
--Phần 5/6 — Manual Grading, Test Results, User Progress (đã FIX cascade)
/* ========== MANUAL GRADING (chấm thủ công) ========== */
CREATE TABLE dbo.aptis_manual_grading (
  id           BIGINT IDENTITY(1,1) PRIMARY KEY,
  submissionId BIGINT NOT NULL,
  questionId   INT    NOT NULL,
  rubricId     INT    NULL,
  scores       NVARCHAR(MAX) NULL,  -- JSON điểm theo tiêu chí
  comment      NVARCHAR(MAX) NULL,
  gradedBy     INT    NULL,         -- userId (admin)
  gradedAt     DATETIME2(3) NULL,
  CONSTRAINT FK_mg_submission FOREIGN KEY (submissionId) REFERENCES dbo.aptis_submissions(id) ON DELETE CASCADE,
  CONSTRAINT FK_mg_question   FOREIGN KEY (questionId)   REFERENCES dbo.aptis_questions(id)  ON DELETE NO ACTION,
  CONSTRAINT FK_mg_rubric     FOREIGN KEY (rubricId)     REFERENCES dbo.aptis_rubrics(id)    ON DELETE NO ACTION,
  CONSTRAINT FK_mg_grader     FOREIGN KEY (gradedBy)     REFERENCES dbo.aptis_users(id)      ON DELETE NO ACTION
);
GO

/* ========== TEST RESULTS (tổng kết bài) ========== */
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
GO

/* ========== USER PROGRESS (tiến độ từng câu) ========== */
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
GO

/* Chỉ mục hữu ích */
CREATE INDEX IX_tr_user_set ON dbo.aptis_test_results(userId, setId);
CREATE INDEX IX_up_user_set_q ON dbo.aptis_user_progress(userId, setId, questionId);
GO
--Phần 6/6 — Indexes gợi ý & Seed tối thiểu
/* ========== INDEXES gợi ý thêm ========== */
CREATE INDEX IX_questions_skill_type ON dbo.aptis_questions(skill, [type]);
CREATE INDEX IX_set_questions_set_section_ord ON dbo.aptis_set_questions(setId, [section], [order]);

/* ========== SEED TỐI THIỂU (tuỳ chọn) ========== */
INSERT INTO dbo.aptis_users (email, passwordHash, name, role)
VALUES (N'admin@aptis.com', N'admin-hash-demo', N'Administrator', N'admin');

INSERT INTO dbo.aptis_settings (defaultTime, shuffle, allowReview, theme, language, notifications, autoSave)
VALUES (45, 0, 1, N'light', N'vi', 1, 1);

-- Ví dụ tạo rubric Writing (demo)
INSERT INTO dbo.aptis_rubrics (title, skill, criteria)
VALUES (N'Writing B1 Rubric', N'Writing', N'{"Grammar":10,"Vocabulary":10,"Coherence":10,"Task":10}');
GO
