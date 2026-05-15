-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('USER', 'MAYA');

-- CreateTable
CREATE TABLE "Conversation" (
    "id"        TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId"   TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTurn" (
    "id"             TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role"           "ConversationRole" NOT NULL,
    "text"           TEXT NOT NULL,
    "occurredAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated"      BOOLEAN,

    CONSTRAINT "ConversationTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_studentId_updatedAt_idx"
    ON "Conversation"("studentId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "ConversationTurn_conversationId_occurredAt_idx"
    ON "ConversationTurn"("conversationId", "occurredAt");

-- AddForeignKey
ALTER TABLE "Conversation"
    ADD CONSTRAINT "Conversation_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTurn"
    ADD CONSTRAINT "ConversationTurn_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
