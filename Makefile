.PHONY: help install lint build test dev docker-build docker-up docker-down clean

# Load .env if it exists (for VITE_* vars passed to docker build)
-include .env
export

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── App ─────────────────────────────────────────────────────────────────────

install: ## Install dependencies
	npm install

lint: ## Lint (ESLint + TypeScript)
	npm run lint

build: ## Production build
	npm run build

test: ## Run tests (placeholder — add Vitest in a later PR)
	@echo "No tests yet. Coming soon."

dev: ## Start dev server (requires .env.local with VITE_API_BASE_URL)
	npm run dev

# ── Docker ──────────────────────────────────────────────────────────────────

docker-build: ## Build production Docker image (reads VITE_* from .env)
	docker compose build

docker-up: ## Start production stack in the background
	docker compose up -d

docker-down: ## Stop production stack
	docker compose down

docker-dev: ## Start dev stack (hot reload, mounts source)
	docker compose -f docker-compose.dev.yml up

# ── Misc ────────────────────────────────────────────────────────────────────

clean: ## Remove build artefacts and node_modules
	rm -rf dist node_modules
