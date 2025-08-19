import fs from 'fs';
import path from 'path';
import { Question, Topic } from '@shared/schema';

// Note: In a real implementation, you would install and use:
// - jsPDF for PDF generation
// - html2canvas for rendering complex layouts
// For this implementation, we'll create a simplified interface

export interface PdfGenerationConfig {
  includeQuestionText: boolean;
  includeVectorDiagrams: boolean;
  includeAnswerSchemes: boolean;
  includeSourceInfo: boolean;
  sortBy: 'difficulty' | 'year_newest' | 'year_oldest' | 'question_type';
  layout: 'standard' | 'compact';
}

export interface GeneratedPdfResult {
  filePath: string;
  filename: string;
  fileSize: string;
  questionCount: number;
  diagramCount: number;
}

export class PdfGenerator {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'generated_pdfs');
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateTopicPdf(
    topic: Topic,
    questions: Question[],
    config: PdfGenerationConfig
  ): Promise<GeneratedPdfResult> {
    try {
      // Sort questions based on configuration
      const sortedQuestions = this.sortQuestions(questions, config.sortBy);
      
      // Filter questions based on configuration
      const filteredQuestions = this.filterQuestions(sortedQuestions, config);
      
      // Generate filename
      const filename = this.generateFilename(topic);
      const filePath = path.join(this.outputDir, filename);
      
      // Generate PDF content
      const pdfContent = await this.generatePdfContent(topic, filteredQuestions, config);
      
      // Write PDF file (simulated)
      await this.writePdfFile(filePath, pdfContent);
      
      // Calculate statistics
      const diagramCount = filteredQuestions.filter(q => q.hasVectorDiagram).length;
      const fileSize = await this.getFileSize(filePath);
      
      return {
        filePath,
        filename,
        fileSize,
        questionCount: filteredQuestions.length,
        diagramCount
      };
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateCustomPdf(
    questions: Question[],
    config: PdfGenerationConfig,
    title: string,
    subtitle: string
  ): Promise<GeneratedPdfResult> {
    try {
      // Sort questions based on configuration
      const sortedQuestions = this.sortQuestions(questions, config.sortBy);
      
      // Filter questions based on configuration
      const filteredQuestions = this.filterQuestions(sortedQuestions, config);
      
      // Generate filename
      const filename = this.generateCustomFilename(title);
      const filePath = path.join(this.outputDir, filename);
      
      // Generate PDF content
      const pdfContent = await this.generateCustomPdfContent(title, subtitle, filteredQuestions, config);
      
      // Write PDF file
      await this.writePdfFile(filePath, pdfContent);
      
      // Calculate statistics
      const diagramCount = filteredQuestions.filter(q => q.hasVectorDiagram).length;
      const fileSize = await this.getFileSize(filePath);
      
      return {
        filePath,
        filename,
        fileSize,
        questionCount: filteredQuestions.length,
        diagramCount
      };
    } catch (error) {
      throw new Error(`Failed to generate custom PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private sortQuestions(questions: Question[], sortBy: string): Question[] {
    const sorted = [...questions];
    
    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder: Record<string, number> = { 'easy': 1, 'medium': 2, 'hard': 3 };
        return sorted.sort((a, b) => 
          (difficultyOrder[a.difficulty || 'medium'] || 2) - (difficultyOrder[b.difficulty || 'medium'] || 2)
        );
      
      case 'year_newest':
        return sorted.sort((a, b) => {
          const yearA = parseInt(a.paperYear || '0');
          const yearB = parseInt(b.paperYear || '0');
          return yearB - yearA;
        });
      
      case 'year_oldest':
        return sorted.sort((a, b) => {
          const yearA = parseInt(a.paperYear || '0');
          const yearB = parseInt(b.paperYear || '0');
          return yearA - yearB;
        });
      
      default:
        return sorted;
    }
  }

  private filterQuestions(questions: Question[], config: PdfGenerationConfig): Question[] {
    let filtered = [...questions];
    
    if (!config.includeVectorDiagrams) {
      filtered = filtered.filter(q => !q.hasVectorDiagram);
    }
    
    return filtered;
  }

  private generateFilename(topic: Topic): string {
    const sanitized = topic.mainTopic.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitized}_${timestamp}.pdf`;
  }

  private generateCustomFilename(title: string): string {
    const sanitized = title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitized}_${timestamp}.pdf`;
  }

  private async generatePdfContent(
    topic: Topic,
    questions: Question[],
    config: PdfGenerationConfig
  ): Promise<string> {
    // In a real implementation, this would use jsPDF to create actual PDF content
    // For now, we'll return a simulated PDF structure
    
    const header = `O-Level ${topic.subject?.toUpperCase()} - ${topic.mainTopic}`;
    const subtitle = topic.subtopic ? `Subtopic: ${topic.subtopic}` : 'All Subtopics';
    
    let content = `PDF Document: ${header}\n`;
    content += `${subtitle}\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Questions: ${questions.length}\n\n`;
    
    questions.forEach((question, index) => {
      content += `Question ${index + 1}:\n`;
      content += `${question.questionText}\n`;
      
      if (config.includeSourceInfo && question.paperYear) {
        content += `Source: ${question.paperYear} ${question.paperSession || ''} Paper\n`;
      }
      
      if (question.marks) {
        content += `Marks: ${question.marks}\n`;
      }
      
      if (question.hasVectorDiagram && config.includeVectorDiagrams) {
        content += `[Vector Diagram Included]\n`;
      }
      
      content += '\n---\n\n';
    });
    
    return content;
  }

  private async generateCustomPdfContent(
    title: string,
    subtitle: string,
    questions: Question[],
    config: PdfGenerationConfig
  ): Promise<string> {
    let content = `PDF Document: ${title}\n`;
    content += `${subtitle}\n`;
    content += `Generated on: ${new Date().toLocaleDateString()}\n`;
    content += `Total Questions: ${questions.length}\n\n`;
    
    questions.forEach((question, index) => {
      content += `Question ${index + 1}:\n`;
      content += `${question.questionText}\n`;
      
      if (config.includeSourceInfo && question.paperYear) {
        content += `Source: ${question.paperYear} ${question.paperSession || ''} Paper\n`;
      }
      
      if (question.marks) {
        content += `Marks: ${question.marks}\n`;
      }
      
      if (question.hasVectorDiagram && config.includeVectorDiagrams) {
        content += `[Vector Diagram Included]\n`;
      }
      
      content += '\n---\n\n';
    });
    
    return content;
  }

  private async writePdfFile(filePath: string, content: string): Promise<void> {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('O-Level Past Paper Questions', 20, 20);
    
    // Split content into lines and add to PDF
    const lines = content.split('\n');
    let yPosition = 40;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const marginBottom = 20;
    
    doc.setFontSize(10);
    
    for (const line of lines) {
      if (yPosition > pageHeight - marginBottom) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Handle long lines by splitting them
      if (line.length > 80) {
        const wrappedLines = doc.splitTextToSize(line, 170);
        for (const wrappedLine of wrappedLines) {
          if (yPosition > pageHeight - marginBottom) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(wrappedLine, 20, yPosition);
          yPosition += lineHeight;
        }
      } else {
        doc.text(line, 20, yPosition);
        yPosition += lineHeight;
      }
    }
    
    // Save the PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    await fs.promises.writeFile(filePath, pdfBuffer);
  }

  private async getFileSize(filePath: string): Promise<string> {
    try {
      const stats = await fs.promises.stat(filePath);
      const sizeInBytes = stats.size;
      
      if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} KB`;
      } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }

  async deletePdf(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  async getPdfBuffer(filePath: string): Promise<Buffer> {
    try {
      return await fs.promises.readFile(filePath);
    } catch (error) {
      throw new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfGenerator = new PdfGenerator();
