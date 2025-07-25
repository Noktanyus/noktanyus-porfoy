BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[About] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [subTitle] NVARCHAR(1000),
    [headerTitle] NVARCHAR(1000) NOT NULL,
    [profileImage] NVARCHAR(1000),
    [aboutImage] NVARCHAR(1000),
    [content] NVARCHAR(1000) NOT NULL,
    [contactEmail] NVARCHAR(1000),
    [socialGithub] NVARCHAR(1000),
    [socialLinkedin] NVARCHAR(1000),
    [socialInstagram] NVARCHAR(1000),
    [workingOn] NVARCHAR(1000) NOT NULL CONSTRAINT [About_workingOn_df] DEFAULT '',
    CONSTRAINT [About_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Experience] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [company] NVARCHAR(1000) NOT NULL,
    [date] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [aboutId] NVARCHAR(1000),
    CONSTRAINT [Experience_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Skill] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [icon] NVARCHAR(1000),
    [aboutId] NVARCHAR(1000),
    CONSTRAINT [Skill_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Testimonial] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [company] NVARCHAR(1000) NOT NULL,
    [avatar] NVARCHAR(1000),
    [comment] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Testimonial_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Blog] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL CONSTRAINT [Blog_date_df] DEFAULT CURRENT_TIMESTAMP,
    [description] NVARCHAR(1000) NOT NULL,
    [thumbnail] NVARCHAR(1000),
    [author] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [tags] NVARCHAR(1000) NOT NULL CONSTRAINT [Blog_tags_df] DEFAULT '',
    [content] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Blog_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Blog_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [mainImage] NVARCHAR(1000),
    [technologies] NVARCHAR(1000) NOT NULL CONSTRAINT [Project_technologies_df] DEFAULT '',
    [liveDemo] NVARCHAR(1000),
    [githubRepo] NVARCHAR(1000),
    [order] INT NOT NULL CONSTRAINT [Project_order_df] DEFAULT 0,
    [featured] BIT NOT NULL CONSTRAINT [Project_featured_df] DEFAULT 0,
    [isLive] BIT NOT NULL CONSTRAINT [Project_isLive_df] DEFAULT 0,
    [content] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Project_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Popup] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [youtubeEmbedUrl] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Popup_isActive_df] DEFAULT 1,
    [buttons] NVARCHAR(1000) NOT NULL CONSTRAINT [Popup_buttons_df] DEFAULT '[]',
    CONSTRAINT [Popup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Popup_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [Message_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [isRead] BIT NOT NULL CONSTRAINT [Message_isRead_df] DEFAULT 0,
    [replies] NVARCHAR(1000) NOT NULL CONSTRAINT [Message_replies_df] DEFAULT '[]',
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[HomeSettings] (
    [id] NVARCHAR(1000) NOT NULL,
    [featuredContentType] NVARCHAR(1000) NOT NULL,
    [youtubeUrl] NVARCHAR(1000),
    [textTitle] NVARCHAR(1000),
    [textContent] NVARCHAR(1000),
    [customHtml] NVARCHAR(1000),
    CONSTRAINT [HomeSettings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SeoSettings] (
    [id] NVARCHAR(1000) NOT NULL,
    [siteTitle] NVARCHAR(1000) NOT NULL,
    [siteDescription] NVARCHAR(1000) NOT NULL,
    [siteKeywords] NVARCHAR(1000) NOT NULL CONSTRAINT [SeoSettings_siteKeywords_df] DEFAULT '',
    [canonicalUrl] NVARCHAR(1000) NOT NULL,
    [robots] NVARCHAR(1000) NOT NULL,
    [favicon] NVARCHAR(1000),
    [ogTitle] NVARCHAR(1000),
    [ogDescription] NVARCHAR(1000),
    [ogImage] NVARCHAR(1000),
    [ogType] NVARCHAR(1000),
    [ogUrl] NVARCHAR(1000),
    [ogSiteName] NVARCHAR(1000),
    [twitterCard] NVARCHAR(1000),
    [twitterSite] NVARCHAR(1000),
    [twitterCreator] NVARCHAR(1000),
    [twitterTitle] NVARCHAR(1000),
    [twitterDescription] NVARCHAR(1000),
    [twitterImage] NVARCHAR(1000),
    CONSTRAINT [SeoSettings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Experience] ADD CONSTRAINT [Experience_aboutId_fkey] FOREIGN KEY ([aboutId]) REFERENCES [dbo].[About]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Skill] ADD CONSTRAINT [Skill_aboutId_fkey] FOREIGN KEY ([aboutId]) REFERENCES [dbo].[About]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
