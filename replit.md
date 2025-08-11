# O-Level AI Past Paper Analyzer

## Overview

This is a full-stack web application that uses AI to analyze O-level science past papers. The system extracts topic-specific questions with vector diagrams and generates organized PDFs. It processes syllabus documents, past papers, and marking schemes to categorize questions by topics and subtopics, then generates customized PDF outputs based on user preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Database Migration Completed
- Successfully migrated from in-memory storage to persistent PostgreSQL database
- Data now persists across server restarts, preventing loss of uploaded documents and extracted questions
- Implemented DatabaseStorage class with full CRUD operations for all data entities

### Enhanced Question Processing  
- Fixed status bar progression to properly show progress from 20% to 90% during AI processing
- Improved question extraction with better error handling and progress reporting
- Enhanced PDF generation with proper file headers for better download compatibility

### Interactive Question Preview
- Added drag-and-drop question preview component using React Beautiful DnD
- Users can now view extracted questions in an organized interface
- Implemented custom PDF builder where users can drag questions from available list to PDF builder
- Added question metadata display: difficulty level, marks, vector diagrams, paper year/session
- Custom PDF generation API endpoint for user-selected questions

### Bug Fixes
- Fixed PDF download issues by adding proper PDF headers to generated files
- Corrected TypeScript import issues for component libraries
- Enhanced error handling throughout the application pipeline

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: Multer for handling PDF uploads with file size limits and type validation
- **API Design**: RESTful endpoints with structured error handling and request logging middleware
- **Development**: Hot module replacement via Vite integration for seamless development experience

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations  
- **Connection**: Neon Database serverless PostgreSQL for cloud-hosted database
- **Schema**: Structured tables for documents, topics, questions, generated PDFs, and processing jobs
- **Storage Interface**: Abstracted storage layer now using DatabaseStorage for persistent data across server restarts

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **File Security**: Server-side file validation and secure upload handling with temporary file storage

### AI Processing Pipeline
- **AI Provider**: OpenAI GPT-4o for natural language processing and document analysis
- **Document Processing**: PDF text extraction, image recognition for vector diagrams, and content categorization
- **Topic Extraction**: Automated syllabus analysis to identify main topics and subtopics
- **Question Analysis**: AI-powered question categorization, difficulty assessment, and diagram detection

### PDF Generation System
- **Output Generation**: Custom PDF generation with configurable layouts and content inclusion options
- **Processing Jobs**: Asynchronous job processing with status tracking for long-running operations
- **File Management**: Organized file storage with metadata tracking and download capabilities

## External Dependencies

### Core Technologies
- **OpenAI API**: GPT-4o model for document analysis, topic extraction, and question categorization
- **Neon Database**: Serverless PostgreSQL hosting for production database
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect

### Frontend Libraries
- **TanStack Query**: Server state management and API data fetching
- **Radix UI**: Accessible UI primitive components
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

### Backend Services
- **Express.js**: Web application framework
- **Multer**: Multipart form data handling for file uploads
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and enhanced development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration

### File Processing (Planned Implementation)
- **pdf-parse**: PDF text extraction (noted for future implementation)
- **pdf2pic**: PDF to image conversion for diagram extraction
- **sharp**: Image processing and optimization
- **jsPDF**: Client-side PDF generation capabilities