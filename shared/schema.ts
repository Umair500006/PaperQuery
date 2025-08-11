import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  type: text("type").notNull(), // 'syllabus' | 'pastpaper' | 'markingscheme'
  subject: text("subject"), // 'physics' | 'chemistry' | 'biology'
  content: text("content"), // extracted text content
  metadata: json("metadata"), // file size, upload date, etc.
  processingStatus: text("processing_status").default("pending"), // 'pending' | 'processing' | 'completed' | 'error'
  createdAt: timestamp("created_at").defaultNow(),
});

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  subject: text("subject").notNull(),
  mainTopic: text("main_topic").notNull(),
  subtopic: text("subtopic"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id),
  topicId: varchar("topic_id").references(() => topics.id),
  questionText: text("question_text").notNull(),
  questionNumber: text("question_number"),
  paperYear: text("paper_year"),
  paperSession: text("paper_session"), // 'june' | 'november'
  hasVectorDiagram: boolean("has_vector_diagram").default(false),
  diagramData: json("diagram_data"), // base64 image data and metadata
  difficulty: text("difficulty"), // 'easy' | 'medium' | 'hard'
  marks: integer("marks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedPdfs = pgTable("generated_pdfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  topicId: varchar("topic_id").references(() => topics.id),
  subject: text("subject").notNull(),
  mainTopic: text("main_topic").notNull(),
  subtopic: text("subtopic"),
  questionCount: integer("question_count").notNull(),
  diagramCount: integer("diagram_count").notNull(),
  fileSize: text("file_size").notNull(),
  filePath: text("file_path").notNull(),
  configuration: json("configuration"), // output settings
  createdAt: timestamp("created_at").defaultNow(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'syllabus_analysis' | 'question_extraction' | 'pdf_generation'
  status: text("status").default("pending"), // 'pending' | 'processing' | 'completed' | 'error'
  progress: integer("progress").default(0), // 0-100
  statusMessage: text("status_message"),
  documentIds: json("document_ids"), // array of document IDs being processed
  result: json("result"), // processing result data
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedPdfSchema = createInsertSchema(generatedPdfs).omit({
  id: true,
  createdAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertGeneratedPdf = z.infer<typeof insertGeneratedPdfSchema>;
export type GeneratedPdf = typeof generatedPdfs.$inferSelect;

export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
