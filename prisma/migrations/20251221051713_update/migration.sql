BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[aptis_lessons] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(1000),
    [skill] NVARCHAR(50) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [aptis_lessons_status_df] DEFAULT 'draft',
    [durationMinutes] INT,
    [orderIndex] INT,
    [coverImageUrl] NVARCHAR(1000),
    [authorId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aptis_lessons_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2,
    CONSTRAINT [aptis_lessons_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[aptis_lessons] ADD CONSTRAINT [aptis_lessons_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[aptis_users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
