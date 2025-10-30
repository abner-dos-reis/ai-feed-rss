# AI Feed RSS - Docker Development Commands

# Variables
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = ai-feed-rss

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

.PHONY: help build up down restart logs clean test lint format

# Default target
help: ## Show this help message
	@echo "AI Feed RSS Development Commands"
	@echo "================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
build: ## Build all Docker containers
	@echo "$(YELLOW)Building Docker containers...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build --no-cache

up: ## Start all services in development mode
	@echo "$(YELLOW)Starting AI Feed RSS services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost:7200"
	@echo "Backend API: http://localhost:7201"
	@echo "Nginx Proxy: http://localhost:7204"
	@echo "Database: localhost:7202"
	@echo "Redis: localhost:7203"

down: ## Stop all services
	@echo "$(YELLOW)Stopping AI Feed RSS services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down

restart: down up ## Restart all services

logs: ## Show logs from all services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-backend: ## Show backend logs
	docker-compose -f $(COMPOSE_FILE) logs -f backend

logs-frontend: ## Show frontend logs
	docker-compose -f $(COMPOSE_FILE) logs -f frontend

logs-db: ## Show database logs
	docker-compose -f $(COMPOSE_FILE) logs -f database

# Database commands
db-shell: ## Connect to database shell
	docker-compose -f $(COMPOSE_FILE) exec database psql -U postgres -d ai_feed_rss

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(RED)WARNING: This will destroy all database data!$(NC)"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose -f $(COMPOSE_FILE) down -v
	docker-compose -f $(COMPOSE_FILE) up -d database
	@echo "$(GREEN)Database reset complete!$(NC)"

# Development tools
shell-backend: ## Open shell in backend container
	docker-compose -f $(COMPOSE_FILE) exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose -f $(COMPOSE_FILE) exec frontend sh

shell-db: ## Open shell in database container
	docker-compose -f $(COMPOSE_FILE) exec database bash

# Cleaning commands
clean: ## Remove all containers, networks, and volumes
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-images: ## Remove all project images
	docker-compose -f $(COMPOSE_FILE) down --rmi all

# Testing commands
test: ## Run all tests
	@echo "$(YELLOW)Running tests...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec backend python -m pytest
	docker-compose -f $(COMPOSE_FILE) exec frontend npm test -- --coverage --watchAll=false

test-backend: ## Run backend tests only
	docker-compose -f $(COMPOSE_FILE) exec backend python -m pytest

test-frontend: ## Run frontend tests only
	docker-compose -f $(COMPOSE_FILE) exec frontend npm test -- --coverage --watchAll=false

# Code quality commands
lint: ## Run linting on all code
	@echo "$(YELLOW)Running linting...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec backend flake8 .
	docker-compose -f $(COMPOSE_FILE) exec frontend npm run lint

lint-fix: ## Fix linting issues automatically
	docker-compose -f $(COMPOSE_FILE) exec backend black . && docker-compose -f $(COMPOSE_FILE) exec backend isort .
	docker-compose -f $(COMPOSE_FILE) exec frontend npm run lint:fix

format: ## Format all code
	docker-compose -f $(COMPOSE_FILE) exec backend black .
	docker-compose -f $(COMPOSE_FILE) exec backend isort .
	docker-compose -f $(COMPOSE_FILE) exec frontend npm run format

# Monitoring commands
status: ## Show status of all containers
	docker-compose -f $(COMPOSE_FILE) ps

health: ## Check health of all services
	@echo "$(YELLOW)Checking service health...$(NC)"
	@curl -f http://localhost:7204/health >/dev/null 2>&1 && echo "$(GREEN)✓ Nginx$(NC)" || echo "$(RED)✗ Nginx$(NC)"
	@curl -f http://localhost:7201/health >/dev/null 2>&1 && echo "$(GREEN)✓ Backend$(NC)" || echo "$(RED)✗ Backend$(NC)"
	@curl -f http://localhost:7200 >/dev/null 2>&1 && echo "$(GREEN)✓ Frontend$(NC)" || echo "$(RED)✗ Frontend$(NC)"

# Installation commands
install: ## Initial setup and installation
	@echo "$(YELLOW)Setting up AI Feed RSS for development...$(NC)"
	cp .env.example .env
	@echo "$(GREEN)✓ Environment file created$(NC)"
	@echo "$(YELLOW)Please edit .env file with your configuration$(NC)"
	@echo "$(YELLOW)Then run: make build && make up$(NC)"

# Quick development workflow
dev: build up ## Build and start development environment
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "Don't forget to check the logs: make logs"

# Production commands (use with caution)
prod-build: ## Build for production
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker-compose -f $(COMPOSE_FILE) -f docker-compose.prod.yml up -d

# Backup commands
backup-db: ## Create database backup
	@echo "$(YELLOW)Creating database backup...$(NC)"
	docker-compose -f $(COMPOSE_FILE) exec database pg_dump -U postgres ai_feed_rss > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Database backup created!$(NC)"