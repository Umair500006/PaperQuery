import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { pdfProcessor } from "./services/pdfProcessor";
import { pdfGenerator } from "./services/pdfGenerator";
import { 
  extractTopicsFromSyllabus, 
  categorizeQuestions, 
  analyzeImageForDiagrams,
  extractQuestionMetadata 
} from "./services/openai";
import { insertDocumentSchema, insertProcessingJobSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20, // Maximum 20 files per upload
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload documents endpoint
  app.post('/api/upload', upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { type, subject } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      if (!type || !['syllabus', 'pastpaper', 'markingscheme'].includes(type)) {
        return res.status(400).json({ message: 'Invalid document type' });
      }

      // For past papers and marking schemes, subject is required
      if ((type === 'pastpaper' || type === 'markingscheme') && !subject) {
        return res.status(400).json({ message: 'Subject is required for past papers and marking schemes' });
      }

      const uploadedDocuments = [];

      for (const file of files) {
        const documentData = insertDocumentSchema.parse({
          filename: file.originalname,
          type,
          subject,
          metadata: {
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            originalPath: file.path
          },
          processingStatus: 'pending'
        });

        const document = await storage.createDocument(documentData);
        uploadedDocuments.push(document);

        // Start background processing
        processDocumentAsync(document.id, file.path);
      }

      res.json({ documents: uploadedDocuments });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get documents by type
  app.get('/api/documents/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const documents = await storage.getDocumentsByType(type);
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get topics by subject
  app.get('/api/topics/:subject', async (req, res) => {
    try {
      const { subject } = req.params;
      const topics = await storage.getTopicsBySubject(subject);
      res.json({ topics });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get questions by topic
  app.get('/api/questions/topic/:topicId', async (req, res) => {
    try {
      const { topicId } = req.params;
      const questions = await storage.getQuestionsByTopic(topicId);
      res.json({ questions });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Process syllabus to extract topics
  app.post('/api/process-syllabus', async (req, res) => {
    try {
      const { subject } = req.body;
      
      if (!subject) {
        return res.status(400).json({ message: 'Subject is required' });
      }

      // Get all syllabus documents for the subject
      const syllabusDocuments = await storage.getDocumentsByType('syllabus');
      const subjectSyllabus = syllabusDocuments.filter(doc => 
        doc.subject === subject || !doc.subject // Include documents without subject specified
      );

      if (subjectSyllabus.length === 0) {
        return res.status(404).json({ message: 'No syllabus documents found for this subject' });
      }

      // Create a processing job
      const jobData = insertProcessingJobSchema.parse({
        type: 'syllabus_analysis',
        status: 'processing',
        progress: 0,
        statusMessage: 'Extracting topics from syllabus...',
        documentIds: subjectSyllabus.map(doc => doc.id)
      });

      const job = await storage.createProcessingJob(jobData);

      // Start background processing
      processSyllabusAsync(job.id, subjectSyllabus, subject);

      res.json({ jobId: job.id, message: 'Syllabus processing started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Process past papers to extract and categorize questions
  app.post('/api/process-pastpapers', async (req, res) => {
    try {
      const { subject } = req.body;
      
      if (!subject) {
        return res.status(400).json({ message: 'Subject is required' });
      }

      // Get all past paper documents for the subject
      const pastPaperDocuments = await storage.getDocumentsByType('pastpaper');
      const subjectPastPapers = pastPaperDocuments.filter(doc => 
        doc.subject === subject || !doc.subject
      );

      if (subjectPastPapers.length === 0) {
        return res.status(404).json({ message: 'No past paper documents found for this subject' });
      }

      // Check if topics exist for this subject
      const availableTopics = await storage.getTopicsBySubject(subject);
      if (availableTopics.length === 0) {
        return res.status(400).json({ message: 'No topics found. Please process syllabus first to extract topics.' });
      }

      // Create a processing job
      const jobData = insertProcessingJobSchema.parse({
        type: 'question_extraction',
        status: 'processing',
        progress: 0,
        statusMessage: 'Categorizing questions from past papers...',
        documentIds: subjectPastPapers.map(doc => doc.id)
      });

      const job = await storage.createProcessingJob(jobData);

      // Start background processing
      processPastPapersAsync(job.id, subjectPastPapers, subject);

      res.json({ jobId: job.id, message: 'Past paper processing started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Generate PDF
  app.post('/api/generate-pdf', async (req, res) => {
    try {
      const { topicId, config } = req.body;

      if (!topicId) {
        return res.status(400).json({ message: 'Topic ID is required' });
      }

      const topic = await storage.getTopic(topicId);
      if (!topic) {
        return res.status(404).json({ message: 'Topic not found' });
      }

      const questions = await storage.getQuestionsByTopic(topicId);
      if (questions.length === 0) {
        return res.status(400).json({ message: 'No questions found for this topic' });
      }

      // Create processing job
      const job = await storage.createProcessingJob({
        type: 'pdf_generation',
        status: 'processing',
        progress: 0,
        statusMessage: 'Starting PDF generation...',
        documentIds: [topicId]
      });

      // Generate PDF in background
      generatePdfAsync(job.id, topic, questions, config);

      res.json({ jobId: job.id, message: 'PDF generation started' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get processing job status
  app.get('/api/processing-job/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getProcessingJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({ job });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get active processing jobs
  app.get('/api/processing-jobs', async (req, res) => {
    try {
      const jobs = await storage.getActiveProcessingJobs();
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get recent generated PDFs
  app.get('/api/generated-pdfs', async (req, res) => {
    try {
      const pdfs = await storage.getRecentGeneratedPdfs(10);
      res.json({ pdfs });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Download generated PDF
  app.get('/api/download-pdf/:pdfId', async (req, res) => {
    try {
      const { pdfId } = req.params;
      const generatedPdf = await storage.getGeneratedPdf(pdfId);

      if (!generatedPdf) {
        return res.status(404).json({ message: 'PDF not found' });
      }

      const pdfBuffer = await pdfGenerator.getPdfBuffer(generatedPdf.filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${generatedPdf.filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Background processing functions
  async function processDocumentAsync(documentId: string, filePath: string) {
    try {
      await storage.updateDocumentStatus(documentId, 'processing');

      const document = await storage.getDocument(documentId);
      if (!document) return;

      // Extract content from PDF
      const pdfContent = await pdfProcessor.extractContent(filePath);
      await storage.updateDocumentContent(documentId, pdfContent.text);

      if (document.type === 'syllabus') {
        // Extract topics from syllabus using AI
        console.log(`🤖 AI analyzing syllabus for ${document.subject || 'general'} topics...`);
        const extractedTopics = await extractTopicsFromSyllabus(
          pdfContent.text, 
          document.subject || 'general'
        );

        console.log(`✅ AI extracted ${extractedTopics.length} main topics from syllabus`);

        // Save topics to storage
        for (const topic of extractedTopics) {
          // Create main topic
          await storage.createTopic({
            documentId,
            subject: document.subject || 'general',
            mainTopic: topic.mainTopic,
            subtopic: null,
            description: topic.description
          });

          // Create subtopics
          for (const subtopic of topic.subtopics) {
            await storage.createTopic({
              documentId,
              subject: document.subject || 'general',
              mainTopic: topic.mainTopic,
              subtopic,
              description: `Subtopic covering ${subtopic}`
            });
          }
        }

        console.log(`📝 Stored ${extractedTopics.length} main topics with ${extractedTopics.reduce((sum, t) => sum + t.subtopics.length, 0)} total subtopics`);
      } else if (document.type === 'pastpaper') {
        // Get available topics for categorization
        const availableTopics = await storage.getTopicsBySubject(document.subject || 'general');
        const topicsForAI = availableTopics.map(t => ({
          mainTopic: t.mainTopic,
          subtopics: availableTopics
            .filter(st => st.mainTopic === t.mainTopic && st.subtopic)
            .map(st => st.subtopic!)
            .filter(Boolean),
          description: t.description || ''
        }));

        // Categorize questions
        const extractedQuestions = await categorizeQuestions(
          pdfContent.text,
          topicsForAI,
          document.subject || 'general'
        );

        // Save questions to storage
        for (const question of extractedQuestions) {
          const matchingTopic = availableTopics.find(t => 
            t.mainTopic === question.topicMatch && 
            (!question.subtopicMatch || t.subtopic === question.subtopicMatch)
          );

          if (matchingTopic) {
            const metadata = await extractQuestionMetadata(question.questionText);

            await storage.createQuestion({
              documentId,
              topicId: matchingTopic.id,
              questionText: question.questionText,
              questionNumber: question.questionNumber,
              paperYear: metadata.paperYear,
              paperSession: metadata.paperSession,
              hasVectorDiagram: question.hasVectorDiagram,
              difficulty: question.difficulty,
              marks: question.marks
            });
          }
        }

        // Process images for vector diagrams
        for (const image of pdfContent.images) {
          try {
            // Convert SVG to PNG format for OpenAI compatibility
            const pngImageData = await convertSvgToPng(image.imageData);
            const diagramAnalysis = await analyzeImageForDiagrams(pngImageData);
            if (diagramAnalysis.hasVectorDiagram) {
              // Find questions on the same page and update them with diagram data
              const questionsOnPage = await storage.getQuestionsByDocument(documentId);
              // In a real implementation, you would match images to specific questions
              // based on page layout analysis
            }
          } catch (error) {
            console.warn(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continue processing other images
          }
        }
      }

      await storage.updateDocumentStatus(documentId, 'completed');
      
      // Clean up uploaded file
      fs.unlink(filePath, () => {});
    } catch (error) {
      await storage.updateDocumentStatus(documentId, 'error');
      console.error('Document processing error:', error);
    }
  }

  async function processSyllabusAsync(jobId: string, syllabusDocuments: any[], subject: string) {
    try {
      await storage.updateProcessingJob(jobId, {
        status: 'processing',
        progress: 10,
        statusMessage: 'Reading syllabus documents...'
      });

      // Combine content from all syllabus documents
      let combinedContent = '';
      for (const doc of syllabusDocuments) {
        if (doc.content) {
          combinedContent += doc.content + '\n\n';
        } else {
          // Extract content if not already processed
          const pdfContent = await pdfProcessor.extractContent(doc.metadata?.originalPath || '');
          combinedContent += pdfContent.text + '\n\n';
          await storage.updateDocumentContent(doc.id, pdfContent.text);
        }
      }

      await storage.updateProcessingJob(jobId, {
        progress: 30,
        statusMessage: 'Analyzing syllabus content with AI...'
      });

      // Extract topics using AI
      const extractedTopics = await extractTopicsFromSyllabus(combinedContent, subject);

      await storage.updateProcessingJob(jobId, {
        progress: 60,
        statusMessage: 'Saving topics and subtopics...'
      });

      // Save topics to storage
      let topicCount = 0;
      let subtopicCount = 0;

      for (const topic of extractedTopics) {
        // Create main topic entry
        const mainTopicRecord = await storage.createTopic({
          documentId: syllabusDocuments[0].id, // Associate with first document
          subject,
          mainTopic: topic.mainTopic,
          subtopic: null,
          description: topic.description
        });
        topicCount++;

        // Create subtopic entries
        for (const subtopic of topic.subtopics) {
          await storage.createTopic({
            documentId: syllabusDocuments[0].id,
            subject,
            mainTopic: topic.mainTopic,
            subtopic,
            description: `Subtopic: ${subtopic}`
          });
          subtopicCount++;
        }
      }

      await storage.updateProcessingJob(jobId, {
        status: 'completed',
        progress: 100,
        statusMessage: `Successfully extracted ${topicCount} topics and ${subtopicCount} subtopics`,
        result: { topicCount, subtopicCount, topics: extractedTopics }
      });

    } catch (error) {
      await storage.updateProcessingJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusMessage: 'Failed to process syllabus'
      });
    }
  }

  async function generatePdfAsync(jobId: string, topic: any, questions: any[], config: any) {
    try {
      await storage.updateProcessingJob(jobId, {
        status: 'processing',
        progress: 25,
        statusMessage: 'Organizing questions...'
      });

      await storage.updateProcessingJob(jobId, {
        progress: 50,
        statusMessage: 'Extracting diagrams...'
      });

      const result = await pdfGenerator.generateTopicPdf(topic, questions, config);

      await storage.updateProcessingJob(jobId, {
        progress: 75,
        statusMessage: 'Finalizing PDF...'
      });

      // Save generated PDF record
      const generatedPdf = await storage.createGeneratedPdf({
        filename: result.filename,
        topicId: topic.id,
        subject: topic.subject,
        mainTopic: topic.mainTopic,
        subtopic: topic.subtopic,
        questionCount: result.questionCount,
        diagramCount: result.diagramCount,
        fileSize: result.fileSize,
        filePath: result.filePath,
        configuration: config
      });

      await storage.updateProcessingJob(jobId, {
        status: 'completed',
        progress: 100,
        statusMessage: 'PDF generated successfully',
        result: { pdfId: generatedPdf.id, ...result }
      });
    } catch (error) {
      await storage.updateProcessingJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        statusMessage: 'PDF generation failed'
      });
    }
  }

  // Helper function to convert SVG to PNG (simplified simulation)
  async function convertSvgToPng(svgBase64: string): Promise<string> {
    try {
      // In a real implementation, you would use a library like sharp or puppeteer
      // For now, we'll create a simple PNG placeholder
      const pngPlaceholder = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      return pngPlaceholder;
    } catch (error) {
      throw new Error('Failed to convert SVG to PNG');
    }
  }

  // Background function to process past papers
  async function processPastPapersAsync(jobId: string, pastPaperDocuments: any[], subject: string) {
    try {
      await storage.updateProcessingJob(jobId, {
        progress: 10,
        statusMessage: 'Loading available topics...'
      });

      // Get available topics for categorization
      const availableTopics = await storage.getTopicsBySubject(subject);
      const topicsForAI = availableTopics.map(t => ({
        mainTopic: t.mainTopic,
        subtopics: availableTopics
          .filter(st => st.mainTopic === t.mainTopic && st.subtopic)
          .map(st => st.subtopic!)
          .filter(Boolean),
        description: t.description || ''
      }));

      await storage.updateProcessingJob(jobId, {
        progress: 20,
        statusMessage: `Processing ${pastPaperDocuments.length} past paper documents...`
      });

      let processedDocuments = 0;
      let totalQuestions = 0;

      for (const document of pastPaperDocuments) {
        try {
          await storage.updateProcessingJob(jobId, {
            progress: 20 + Math.floor((processedDocuments / pastPaperDocuments.length) * 60),
            statusMessage: `Analyzing ${document.filename}...`
          });

          if (!document.extractedText) {
            console.log(`Skipping ${document.filename} - no extracted text`);
            processedDocuments++;
            continue;
          }

          // Categorize questions using AI
          const extractedQuestions = await categorizeQuestions(
            document.extractedText,
            topicsForAI,
            subject
          );

          // Save questions to storage
          for (const question of extractedQuestions) {
            const matchingTopic = availableTopics.find(t => 
              t.mainTopic === question.topicMatch && 
              (!question.subtopicMatch || t.subtopic === question.subtopicMatch)
            );

            if (matchingTopic) {
              await storage.createQuestion({
                documentId: document.id,
                topicId: matchingTopic.id,
                questionText: question.questionText,
                questionNumber: question.questionNumber,
                paperYear: extractYearFromFilename(document.filename),
                paperSession: extractSessionFromFilename(document.filename) || null,
                hasVectorDiagram: question.hasVectorDiagram,
                difficulty: question.difficulty,
                marks: question.marks || 1
              });
              totalQuestions++;
            }
          }

          processedDocuments++;
        } catch (error) {
          console.error(`Error processing ${document.filename}:`, error);
          // Continue with other documents
        }
      }

      // Complete the job
      await storage.updateProcessingJob(jobId, {
        status: 'completed',
        progress: 100,
        statusMessage: `Successfully categorized ${totalQuestions} questions from ${processedDocuments} documents`,
        result: {
          documentsProcessed: processedDocuments,
          questionsExtracted: totalQuestions
        }
      });

    } catch (error) {
      console.error('Error processing past papers:', error);
      await storage.updateProcessingJob(jobId, {
        status: 'error',
        progress: 0,
        statusMessage: 'Failed to process past papers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  function extractYearFromFilename(filename: string): number | undefined {
    const yearMatch = filename.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : undefined;
  }

  function extractSessionFromFilename(filename: string): string | undefined {
    if (filename.includes('_s')) return 'summer';
    if (filename.includes('_w')) return 'winter';
    if (filename.includes('_m')) return 'march';
    return undefined;
  }

  const httpServer = createServer(app);
  return httpServer;
}
