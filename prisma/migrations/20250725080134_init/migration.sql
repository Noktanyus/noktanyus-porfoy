-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "headerTitle" TEXT NOT NULL,
    "profileImage" TEXT,
    "aboutImage" TEXT,
    "content" TEXT NOT NULL,
    "contactEmail" TEXT,
    "socialGithub" TEXT,
    "socialLinkedin" TEXT,
    "socialInstagram" TEXT,
    "workingOn" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "About_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aboutId" TEXT,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "aboutId" TEXT,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "avatar" TEXT,
    "comment" TEXT NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "thumbnail" TEXT,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mainImage" TEXT,
    "technologies" TEXT NOT NULL DEFAULT '',
    "liveDemo" TEXT,
    "githubRepo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "youtubeEmbedUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "buttons" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "replies" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSettings" (
    "id" TEXT NOT NULL,
    "featuredContentType" TEXT NOT NULL,
    "youtubeUrl" TEXT,
    "textTitle" TEXT,
    "textContent" TEXT,
    "customHtml" TEXT,

    CONSTRAINT "HomeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSettings" (
    "id" TEXT NOT NULL,
    "siteTitle" TEXT NOT NULL,
    "siteDescription" TEXT NOT NULL,
    "siteKeywords" TEXT NOT NULL DEFAULT '',
    "canonicalUrl" TEXT NOT NULL,
    "robots" TEXT NOT NULL,
    "favicon" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "ogType" TEXT,
    "ogUrl" TEXT,
    "ogSiteName" TEXT,
    "twitterCard" TEXT,
    "twitterSite" TEXT,
    "twitterCreator" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,

    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Popup_slug_key" ON "Popup"("slug");

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_aboutId_fkey" FOREIGN KEY ("aboutId") REFERENCES "About"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_aboutId_fkey" FOREIGN KEY ("aboutId") REFERENCES "About"("id") ON DELETE SET NULL ON UPDATE CASCADE;
