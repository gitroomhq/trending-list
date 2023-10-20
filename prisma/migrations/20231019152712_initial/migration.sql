-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "handle" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRepository" (
    "id" TEXT NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Repositories" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "languagePlace" INTEGER NOT NULL,
    "trendingPlace" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepositoriesHistory" (
    "id" SERIAL NOT NULL,
    "repositoryId" INTEGER NOT NULL,
    "place" INTEGER NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoriesHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "UserRepository_repositoryId_userId_key" ON "UserRepository"("repositoryId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Repositories_url_idx" ON "Repositories"("url");

-- CreateIndex
CREATE INDEX "Repositories_language_idx" ON "Repositories"("language");

-- CreateIndex
CREATE INDEX "Repositories_languagePlace_idx" ON "Repositories"("languagePlace");

-- CreateIndex
CREATE INDEX "Repositories_trendingPlace_idx" ON "Repositories"("trendingPlace");

-- CreateIndex
CREATE UNIQUE INDEX "Repositories_url_key" ON "Repositories"("url");

-- CreateIndex
CREATE INDEX "RepositoriesHistory_place_idx" ON "RepositoriesHistory"("place");

-- CreateIndex
CREATE INDEX "RepositoriesHistory_language_idx" ON "RepositoriesHistory"("language");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepository" ADD CONSTRAINT "UserRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepository" ADD CONSTRAINT "UserRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoriesHistory" ADD CONSTRAINT "RepositoriesHistory_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repositories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
