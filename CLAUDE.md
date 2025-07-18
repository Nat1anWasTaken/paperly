# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paperly is an AI-powered paper reading software that helps streamline research workflows. The application consists of:

- **Frontend**: Next.js 15 React application with TypeScript (in `website/`)
- **Backend**: FastAPI Python application with MongoDB and S3 storage (in `backend/`)
- **Infrastructure**: Docker Compose setup with MongoDB and MinIO for local development

## Development Commands

### Frontend (Next.js)
```bash
cd website
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Backend (Python/FastAPI)
```bash
cd backend
uv run main.py    # Start FastAPI server with workers
```

### Infrastructure
```bash
docker-compose up -d    # Start MongoDB and MinIO services
```

## Architecture

### Data Flow
1. **Paper Upload**: PDFs are uploaded to S3/MinIO storage
2. **Processing Pipeline**: Background workers extract content and generate blocks:
   - `MarkdownExtractionWorker`: Converts PDF to structured markdown
   - `MetadataGeneratorWorker`: Generates paper metadata
   - `IntoBlocksWorker`: Breaks content into semantic blocks
   - `GenerateQuizzesWorker`: Creates interactive quiz blocks
3. **Storage**: Structured data stored in MongoDB as documents
4. **Frontend**: React components render different block types with interactive features

### Block System
The core abstraction is "blocks" - semantic units of content with 12 different types:
- `HEADER`, `PARAGRAPH`, `FIGURE`, `TABLE`, `EQUATION`, `CODE_BLOCK`
- `QUOTE`, `CALLOUT`, `REFERENCE`, `FOOTNOTE`, `QUIZ`

Each block type has specialized rendering components in `website/src/components/blocks/`.

### API Integration
- Backend exposes REST API for papers, blocks, summaries, translations, and chat
- Frontend uses OpenAPI-generated types in `website/src/data/types.ts`
- API responses use MongoDB ObjectIDs and reference structures

### Key Features
- **AI Chat**: Real-time chat with papers using OpenAI integration
- **Interactive Blocks**: Selectable content with context toolbars
- **Math Rendering**: KaTeX support for equations
- **Code Highlighting**: Syntax highlighting for code blocks
- **Responsive Design**: Tailwind CSS with dark/light theme support

## Python Standards

When writing Python functions, use reStructuredText-style docstrings:

```python
def get_presigned_upload_url(paper_id: str, content_type: str) -> str:
    """
    Obtain a pre-signed URL for uploading a paper file to the service's storage bucket.

    You must upload the file using this URL before creating or submitting the paper resource.

    :param paper_id: Unique identifier of the paper the file is associated with.
    :param content_type: MIME type of the file to be uploaded (e.g. 'application/pdf').
    :return: A time-limited pre-signed URL for direct file upload to the storage backend.
    :rtype: str
    """
    # implementation here
    ...
```

## Key Dependencies

### Frontend
- **Next.js 15**: React framework with App Router
- **Tailwind CSS 4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **KaTeX**: Math rendering
- **React Markdown**: Markdown rendering with syntax highlighting

### Backend
- **FastAPI**: Modern Python web framework
- **Beanie**: Async MongoDB ODM built on Motor
- **OpenAI**: AI integration for chat and content generation
- **Marker-PDF**: Advanced PDF processing
- **Boto3**: AWS S3 client for file storage