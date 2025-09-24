# Overview

This is a comprehensive legal practice management web application designed for lawyers in Russia. The system provides case management, client relationship management (CRM), document handling with OCR processing, and an AI assistant powered by Google Gemini Pro 2.5. The application focuses on streamlining legal workflows with features like automatic text recognition from scanned documents, intelligent case analysis, and real-time collaboration tools.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18+ with TypeScript**: Modern component-based architecture using functional components and hooks
- **Vite Build Tool**: Fast development server and optimized production builds
- **Client-Side Routing**: React Router for single-page application navigation
- **State Management**: Hybrid approach using Zustand for local state and React Query for server state
- **Form Handling**: React Hook Form with Yup validation for robust form management
- **Styling**: Tailwind CSS utility-first framework for responsive design
- **Animation**: Framer Motion for smooth UI transitions
- **File Upload**: React Dropzone for drag-and-drop file handling

## Backend Architecture
- **Supabase as Backend-as-a-Service**: PostgreSQL database with built-in authentication, real-time subscriptions, and file storage
- **Row Level Security (RLS)**: Database-level security ensuring users can only access their own data
- **Real-time Updates**: WebSocket connections through Supabase for live data synchronization

## Data Storage Design
- **Primary Entities**: lawyers, clients, cases, case_documents, document_comments
- **Relational Structure**: Normalized database with foreign key relationships between entities
- **File Storage**: Supabase Storage for document files with metadata tracking
- **OCR Integration**: Extracted text and metadata stored alongside original documents

## Authentication & Security
- **Supabase Auth**: Handles user registration, login, and session management
- **Row Level Security**: Database policies ensure multi-tenant data isolation
- **Environment Variables**: Sensitive configuration stored securely

# External Dependencies

## Core Services
- **Supabase**: PostgreSQL database, authentication, file storage, and real-time subscriptions
- **Google Gemini Pro 2.5**: AI assistant for legal case analysis and chat functionality
- **Google Vision API**: OCR processing for automatic text extraction from documents

## Frontend Libraries
- **UI Components**: Lucide React for icons, custom components built with Tailwind CSS
- **Data Fetching**: TanStack React Query for server state management and caching
- **Form Management**: React Hook Form with Yup schema validation
- **Date Handling**: date-fns library for date manipulation and formatting
- **File Handling**: React Dropzone for file upload interfaces

## Development Tools
- **TypeScript**: Type safety and improved developer experience
- **ESLint**: Code linting with React-specific rules
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing
- **Vite**: Development server and build tooling optimized for modern frameworks