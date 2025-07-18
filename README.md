# Paperly

An AI-powered paper reading software designed to streamline your research workflow. Paperly transforms academic papers into interactive, structured content with features like AI chat, intelligent blocks, and advanced semantic processing.

## ✨ Features

- **🤖 AI Chat**: Real-time conversations with your papers using OpenAI integration
- **📚 Semantic Blocks**: Content broken into 12 intelligent block types (headers, paragraphs, figures, equations, quizzes, etc.)
- **🎯 Interactive Elements**: Selectable content with context-aware toolbars
- **📐 Math Rendering**: Beautiful equation display with KaTeX
- **💻 Code Highlighting**: Syntax highlighting for code blocks
- **🌓 Theme Support**: Dark and light modes with responsive design
- **📊 Advanced Processing**: PDF to structured markdown conversion with metadata extraction
- **🧠 Quiz Generation**: Auto-generated interactive quizzes from paper content

## 🏗️ Architecture

Paperly consists of three main components:

### Frontend (Next.js 15)

- **Location**: `website/`
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS 4 with Radix UI components
- **Features**: Interactive block rendering, AI chat interface, responsive design

### Backend (FastAPI)

- **Location**: `backend/`
- **Framework**: FastAPI with Python 3.12+
- **Database**: MongoDB with Beanie ODM
- **Storage**: S3-compatible storage (MinIO for local development)
- **AI**: OpenAI integration for chat and content generation

### Infrastructure

- **Docker Compose**: MongoDB and MinIO services for local development
- **Processing Pipeline**: Background workers for PDF extraction and content generation

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ with pnpm
- **Python** 3.12+
- **Docker** and Docker Compose
- **uv** (Python package manager)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd paperly
   ```

2. **Start infrastructure services**

   ```bash
   docker-compose up -d
   ```

3. **Set up the backend**

   ```bash
   cd backend
   uv sync
   uv run main.py
   ```

4. **Set up the frontend**

   ```bash
   cd website
   pnpm install
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🛠️ Development

### Frontend Commands

```bash
cd website
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Backend Commands

```bash
cd backend
uv run main.py    # Start FastAPI server with workers
```

### Infrastructure Commands

```bash
docker-compose up -d      # Start MongoDB and MinIO
docker-compose down       # Stop services
docker-compose logs       # View service logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the project conventions in `CLAUDE.md`
4. Test your changes locally
5. Submit a pull request

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🆘 Support

For questions, issues, or contributions, please open an issue on the repository or refer to the documentation in individual component directories.
