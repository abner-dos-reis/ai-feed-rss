# AI FeedRSS

> **Note: This application is currently under development** 🚧

**Built with**: AI for syntax | Human for logic | Learning clean, scalable code  
All repos public to show my evolution as a developer 📈

---

## Overview

AI FeedRSS is an intelligent RSS feed management application that leverages artificial intelligence to organize and filter RSS feeds automatically. The application is designed to handle bulk RSS feed imports and provide smart categorization, filtering, and content recommendations.

## Features

### 🤖 AI-Powered Organization
- **Smart Categorization**: Automatically organizes RSS feeds into categories and subcategories using AI
- **Content Analysis**: AI analyzes feed titles and descriptions to provide intelligent reading suggestions
- **Category-Specific Search**: Search and filter content within specific categories

### 📊 Source-Based Filtering
The application supports filtering RSS feeds based on their origin source:
- 📧 **Email newsletters**
- 📱 **Social media feeds**
- 🎥 **YouTube channels**
- 🌐 **Web feeds**
- 📰 **News sources**
- And more...

### 📝 Content Management
- **Bulk RSS Import**: Add multiple RSS feed links at once
- **Reading Recommendations**: AI suggests what to read based on your preferences and reading history
- **Summary Generation**: Automatically generates summaries of articles and content
- **Smart Filtering**: Advanced filtering options by source, category, date, and relevance

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abner-dos-reis/ai-feed-rss.git
   cd ai-feed-rss
   ```

2. **Set up environment**
   ```bash
   make install  # Creates .env file from template
   # Edit .env file with your configuration
   ```

3. **Start development environment**
   ```bash
   make dev  # Builds and starts all services
   ```

### Services and Ports

- **Frontend**: http://localhost:7200 (React.js)
- **Backend API**: http://localhost:7201 (FastAPI)
- **Nginx Proxy**: http://localhost:7204 (Reverse proxy)
- **Database**: localhost:7202 (PostgreSQL)
- **Redis**: localhost:7203 (Cache)

### Available Commands

```bash
make help          # Show all available commands
make up            # Start all services
make down          # Stop all services
make logs          # Show logs from all services
make db-shell      # Connect to database
make test          # Run all tests
make clean         # Clean up Docker resources
```

## Development

### Project Structure
```
ai-feed-rss/
├── backend/           # FastAPI backend
├── frontend/          # React.js frontend
├── database/          # PostgreSQL init scripts
├── nginx/             # Nginx configuration
├── docker-compose.yml # Docker services
├── Makefile          # Development commands
└── .env              # Environment variables
```

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **Database**: PostgreSQL with SQLAlchemy
- **Cache**: Redis for session and data caching
- **AI Integration**: OpenAI GPT and Transformers
- **Background Tasks**: Celery for RSS fetching

### Frontend (React.js)
- **Framework**: React 18 with hooks
- **UI Library**: Material-UI (MUI)
- **State Management**: React Query
- **Styling**: Styled Components + Emotion
- **Forms**: React Hook Form

### Database Schema
- Users and authentication
- RSS sources and items
- AI-generated categories and summaries
- Reading history and preferences
- Background processing queue

## Planned Features

- [ ] Bulk RSS feed import functionality
- [ ] AI-based categorization system
- [ ] Source-based filtering (email, social media, YouTube, etc.)
- [ ] Content recommendation engine
- [ ] Summary generation for articles
- [ ] Category-specific search
- [ ] Reading history tracking
- [ ] Export/import configurations
- [ ] Mobile-responsive interface
- [ ] API integration for third-party services

## Technology Stack

*Coming soon - Technology stack will be defined during development*

## Installation

*Installation instructions will be provided once the application is ready for testing*

## Usage

*Usage documentation will be available in future releases*

## Contributing

This project is currently in early development. Contribution guidelines will be established once the core functionality is implemented.

## License

*License information will be added soon*

---

**Status**: 🔨 In Development
**Version**: 0.0.1-alpha
**Last Updated**: October 2025

For questions or suggestions, please open an issue in this repository.
