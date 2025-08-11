import { 
  type Document, type InsertDocument,
  type Topic, type InsertTopic,
  type Question, type InsertQuestion,
  type GeneratedPdf, type InsertGeneratedPdf,
  type ProcessingJob, type InsertProcessingJob
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByType(type: string): Promise<Document[]>;
  updateDocumentStatus(id: string, status: string): Promise<void>;
  updateDocumentContent(id: string, content: string): Promise<void>;

  // Topics
  createTopic(topic: InsertTopic): Promise<Topic>;
  getTopic(id: string): Promise<Topic | undefined>;
  getTopicsByDocument(documentId: string): Promise<Topic[]>;
  getTopicsBySubject(subject: string): Promise<Topic[]>;

  // Questions
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByTopic(topicId: string): Promise<Question[]>;
  getQuestionsByDocument(documentId: string): Promise<Question[]>;

  // Generated PDFs
  createGeneratedPdf(pdf: InsertGeneratedPdf): Promise<GeneratedPdf>;
  getGeneratedPdf(id: string): Promise<GeneratedPdf | undefined>;
  getRecentGeneratedPdfs(limit?: number): Promise<GeneratedPdf[]>;

  // Processing Jobs
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<void>;
  getActiveProcessingJobs(): Promise<ProcessingJob[]>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private topics: Map<string, Topic>;
  private questions: Map<string, Question>;
  private generatedPdfs: Map<string, GeneratedPdf>;
  private processingJobs: Map<string, ProcessingJob>;

  constructor() {
    this.documents = new Map();
    this.topics = new Map();
    this.questions = new Map();
    this.generatedPdfs = new Map();
    this.processingJobs = new Map();
  }

  // Documents
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = { 
      ...insertDocument, 
      id, 
      content: insertDocument.content || null,
      subject: insertDocument.subject || null,
      processingStatus: insertDocument.processingStatus || null,
      metadata: insertDocument.metadata || null,
      createdAt: new Date() 
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByType(type: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.type === type);
  }

  async updateDocumentStatus(id: string, status: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.processingStatus = status;
      this.documents.set(id, document);
    }
  }

  async updateDocumentContent(id: string, content: string): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.content = content;
      this.documents.set(id, document);
    }
  }

  // Topics
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = randomUUID();
    const topic: Topic = { 
      ...insertTopic, 
      id, 
      documentId: insertTopic.documentId || null,
      subtopic: insertTopic.subtopic || null,
      description: insertTopic.description || null,
      createdAt: new Date() 
    };
    this.topics.set(id, topic);
    return topic;
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async getTopicsByDocument(documentId: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(topic => topic.documentId === documentId);
  }

  async getTopicsBySubject(subject: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(topic => topic.subject === subject);
  }

  // Questions
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id, 
      documentId: insertQuestion.documentId || null,
      topicId: insertQuestion.topicId || null,
      questionNumber: insertQuestion.questionNumber || null,
      paperYear: insertQuestion.paperYear || null,
      paperSession: insertQuestion.paperSession || null,
      hasVectorDiagram: insertQuestion.hasVectorDiagram || null,
      diagramData: insertQuestion.diagramData || null,
      difficulty: insertQuestion.difficulty || null,
      marks: insertQuestion.marks || null,
      createdAt: new Date() 
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => question.topicId === topicId);
  }

  async getQuestionsByDocument(documentId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => question.documentId === documentId);
  }

  // Generated PDFs
  async createGeneratedPdf(insertPdf: InsertGeneratedPdf): Promise<GeneratedPdf> {
    const id = randomUUID();
    const pdf: GeneratedPdf = { 
      ...insertPdf, 
      id, 
      topicId: insertPdf.topicId || null,
      subtopic: insertPdf.subtopic || null,
      configuration: insertPdf.configuration || null,
      createdAt: new Date() 
    };
    this.generatedPdfs.set(id, pdf);
    return pdf;
  }

  async getGeneratedPdf(id: string): Promise<GeneratedPdf | undefined> {
    return this.generatedPdfs.get(id);
  }

  async getRecentGeneratedPdfs(limit: number = 10): Promise<GeneratedPdf[]> {
    return Array.from(this.generatedPdfs.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  // Processing Jobs
  async createProcessingJob(insertJob: InsertProcessingJob): Promise<ProcessingJob> {
    const id = randomUUID();
    const job: ProcessingJob = { 
      ...insertJob, 
      id, 
      status: insertJob.status || null,
      progress: insertJob.progress || null,
      statusMessage: insertJob.statusMessage || null,
      documentIds: insertJob.documentIds || null,
      result: insertJob.result || null,
      error: insertJob.error || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.processingJobs.set(id, job);
    return job;
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJob>): Promise<void> {
    const job = this.processingJobs.get(id);
    if (job) {
      const updatedJob = { 
        ...job, 
        ...updates, 
        updatedAt: new Date() 
      };
      this.processingJobs.set(id, updatedJob);
    }
  }

  async getActiveProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values()).filter(
      job => job.status === 'pending' || job.status === 'processing'
    );
  }
}

export const storage = new MemStorage();
