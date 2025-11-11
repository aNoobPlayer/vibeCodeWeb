BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[aptis_users] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(255) NOT NULL,
    [passwordHash] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [role] NVARCHAR(20) NOT NULL CONSTRAINT [aptis_users_role_df] DEFAULT 'student',
    [avatar] NVARCHAR(10),
    [isActive] BIT NOT NULL CONSTRAINT [aptis_users_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [lastLogin] DATETIME2,
    CONSTRAINT [aptis_users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [aptis_users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_settings] (
    [id] INT NOT NULL IDENTITY(1,1),
    [defaultTime] INT NOT NULL CONSTRAINT [aptis_settings_defaultTime_df] DEFAULT 45,
    [shuffle] BIT NOT NULL CONSTRAINT [aptis_settings_shuffle_df] DEFAULT 0,
    [allowReview] BIT NOT NULL CONSTRAINT [aptis_settings_allowReview_df] DEFAULT 1,
    [theme] NVARCHAR(20) NOT NULL CONSTRAINT [aptis_settings_theme_df] DEFAULT 'light',
    [language] NVARCHAR(10) NOT NULL CONSTRAINT [aptis_settings_language_df] DEFAULT 'vi',
    [notifications] BIT NOT NULL CONSTRAINT [aptis_settings_notifications_df] DEFAULT 1,
    [autoSave] BIT NOT NULL CONSTRAINT [aptis_settings_autoSave_df] DEFAULT 1,
    [updatedAt] DATETIME2,
    CONSTRAINT [aptis_settings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_audit_logs] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [userId] INT,
    [action] NVARCHAR(100) NOT NULL,
    [details] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_audit_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [aptis_audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_media] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [type] NVARCHAR(30) NOT NULL,
    [size] BIGINT,
    [url] NVARCHAR(1000) NOT NULL,
    [duration] INT,
    [uploaderId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_media_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [aptis_media_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_tips] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(255) NOT NULL,
    [skill] NVARCHAR(50) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [aptis_tips_status_df] DEFAULT 'published',
    [priority] NVARCHAR(20) NOT NULL CONSTRAINT [aptis_tips_priority_df] DEFAULT 'medium',
    [authorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_tips_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [aptis_tips_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_answers] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [submissionId] BIGINT NOT NULL,
    [questionId] INT NOT NULL,
    [answerData] NVARCHAR(max),
    [isCorrect] BIT,
    [score] FLOAT(53),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_ans__creat__0E6E26BF] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK__aptis_an__3213E83FAEC39A0A] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_manual_grading] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [submissionId] BIGINT NOT NULL,
    [questionId] INT NOT NULL,
    [rubricId] INT,
    [scores] NVARCHAR(max),
    [comment] NVARCHAR(max),
    [gradedBy] INT,
    [gradedAt] DATETIME2,
    CONSTRAINT [PK__aptis_ma__3213E83F3F018488] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_questions] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(255),
    [skill] NVARCHAR(50) NOT NULL,
    [type] NVARCHAR(50) NOT NULL,
    [stem] NVARCHAR(max) NOT NULL,
    [optionsJson] NVARCHAR(max),
    [answerKey] NVARCHAR(max),
    [explain] NVARCHAR(max),
    [difficulty] NVARCHAR(20),
    [mediaId] INT,
    [authorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_que__creat__7A672E12] DEFAULT sysutcdatetime(),
    [updatedAt] DATETIME2,
    CONSTRAINT [PK__aptis_qu__3213E83F54772203] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_rubrics] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(200) NOT NULL,
    [skill] NVARCHAR(50) NOT NULL,
    [criteria] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_rub__creat__6FE99F9F] DEFAULT sysutcdatetime(),
    [updatedAt] DATETIME2,
    CONSTRAINT [PK__aptis_ru__3213E83FC37F4524] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_set_questions] (
    [setId] INT NOT NULL,
    [questionId] INT NOT NULL,
    [section] NVARCHAR(50) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [DF__aptis_set__order__01142BA1] DEFAULT 1,
    [score] FLOAT(53),
    [mediaId] INT,
    CONSTRAINT [PK_set_questions] PRIMARY KEY CLUSTERED ([setId],[questionId])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_sets] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [level] NVARCHAR(10),
    [timeLimit] INT NOT NULL CONSTRAINT [DF__aptis_set__timeL__73BA3083] DEFAULT 60,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF__aptis_set__statu__74AE54BC] DEFAULT 'N''published''',
    [authorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_set__creat__75A278F5] DEFAULT sysutcdatetime(),
    [updatedAt] DATETIME2,
    [skill] NVARCHAR(50) NOT NULL CONSTRAINT [DF_aptis_sets_skill] DEFAULT 'N''General''',
    CONSTRAINT [PK__aptis_se__3213E83F5A7C0539] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_submissions] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [setId] INT NOT NULL,
    [startTime] DATETIME2,
    [submitTime] DATETIME2,
    [durationSec] INT,
    [autoScore] FLOAT(53),
    [manualScore] FLOAT(53),
    [totalScore] FLOAT(53),
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [DF__aptis_sub__statu__06CD04F7] DEFAULT 'N''submitted''',
    [attempt] INT NOT NULL CONSTRAINT [DF__aptis_sub__attem__07C12930] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_sub__creat__08B54D69] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK__aptis_su__3213E83FA697D638] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_test_results] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [submissionId] BIGINT NOT NULL,
    [userId] INT NOT NULL,
    [setId] INT NOT NULL,
    [score] FLOAT(53),
    [totalQuestions] INT,
    [correctAnswers] INT,
    [timeSpentSec] INT,
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_tes__creat__18EBB532] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK__aptis_te__3213E83F5228C6AB] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_user_progress] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [submissionId] BIGINT NOT NULL,
    [userId] INT NOT NULL,
    [setId] INT NOT NULL,
    [questionId] INT NOT NULL,
    [isCorrect] BIT,
    [timeSpentSec] INT,
    [attempts] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF__aptis_use__creat__1EA48E88] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK__aptis_us__3213E83F6C4C779D] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[aptis_templates] (
    [id] INT NOT NULL IDENTITY(1,1),
    [label] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [skillsJson] NVARCHAR(max) NOT NULL,
    [typesJson] NVARCHAR(max) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [optionsJson] NVARCHAR(max),
    [correctAnswersJson] NVARCHAR(max),
    [tagsJson] NVARCHAR(max),
    [difficulty] NVARCHAR(20),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_templates_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [aptis_templates_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_answers_question] ON [dbo].[aptis_answers]([questionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_answers_submission] ON [dbo].[aptis_answers]([submissionId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_questions_skill_type] ON [dbo].[aptis_questions]([skill], [type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_set_questions_set_section_ord] ON [dbo].[aptis_set_questions]([setId], [section], [order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_submissions_set] ON [dbo].[aptis_submissions]([setId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_submissions_user] ON [dbo].[aptis_submissions]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_tr_user_set] ON [dbo].[aptis_test_results]([userId], [setId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_up_user_set_q] ON [dbo].[aptis_user_progress]([userId], [setId], [questionId]);

-- AddForeignKey
ALTER TABLE [dbo].[aptis_audit_logs] ADD CONSTRAINT [aptis_audit_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_media] ADD CONSTRAINT [aptis_media_uploaderId_fkey] FOREIGN KEY ([uploaderId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_tips] ADD CONSTRAINT [aptis_tips_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_answers] ADD CONSTRAINT [FK_ans_question] FOREIGN KEY ([questionId]) REFERENCES [dbo].[aptis_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_answers] ADD CONSTRAINT [FK_ans_submission] FOREIGN KEY ([submissionId]) REFERENCES [dbo].[aptis_submissions]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_manual_grading] ADD CONSTRAINT [FK_mg_grader] FOREIGN KEY ([gradedBy]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_manual_grading] ADD CONSTRAINT [FK_mg_question] FOREIGN KEY ([questionId]) REFERENCES [dbo].[aptis_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_manual_grading] ADD CONSTRAINT [FK_mg_rubric] FOREIGN KEY ([rubricId]) REFERENCES [dbo].[aptis_rubrics]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_manual_grading] ADD CONSTRAINT [FK_mg_submission] FOREIGN KEY ([submissionId]) REFERENCES [dbo].[aptis_submissions]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_questions] ADD CONSTRAINT [FK_q_author] FOREIGN KEY ([authorId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_questions] ADD CONSTRAINT [FK_q_media] FOREIGN KEY ([mediaId]) REFERENCES [dbo].[aptis_media]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_set_questions] ADD CONSTRAINT [FK_sq_media] FOREIGN KEY ([mediaId]) REFERENCES [dbo].[aptis_media]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_set_questions] ADD CONSTRAINT [FK_sq_question] FOREIGN KEY ([questionId]) REFERENCES [dbo].[aptis_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_set_questions] ADD CONSTRAINT [FK_sq_set] FOREIGN KEY ([setId]) REFERENCES [dbo].[aptis_sets]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_sets] ADD CONSTRAINT [FK_sets_author] FOREIGN KEY ([authorId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_submissions] ADD CONSTRAINT [FK_sub_set] FOREIGN KEY ([setId]) REFERENCES [dbo].[aptis_sets]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_submissions] ADD CONSTRAINT [FK_sub_user] FOREIGN KEY ([userId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_test_results] ADD CONSTRAINT [FK_tr_set] FOREIGN KEY ([setId]) REFERENCES [dbo].[aptis_sets]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_test_results] ADD CONSTRAINT [FK_tr_submission] FOREIGN KEY ([submissionId]) REFERENCES [dbo].[aptis_submissions]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_test_results] ADD CONSTRAINT [FK_tr_user] FOREIGN KEY ([userId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_user_progress] ADD CONSTRAINT [FK_up_question] FOREIGN KEY ([questionId]) REFERENCES [dbo].[aptis_questions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_user_progress] ADD CONSTRAINT [FK_up_set] FOREIGN KEY ([setId]) REFERENCES [dbo].[aptis_sets]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_user_progress] ADD CONSTRAINT [FK_up_submission] FOREIGN KEY ([submissionId]) REFERENCES [dbo].[aptis_submissions]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[aptis_user_progress] ADD CONSTRAINT [FK_up_user] FOREIGN KEY ([userId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
