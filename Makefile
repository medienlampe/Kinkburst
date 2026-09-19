# Wraps the npm scripts from package.json — type `make <target>` instead of `npm run ...`.
# Run plain `make` for an overview.

.PHONY: help start start-open build preview test test-coverage test-watch lint

help: ## show this overview
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | grep -v '^help:' | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

start: ## dev server at http://localhost:3000/Kinkburst/
	npm run start

start-open: ## dev server reachable on the network (host 0.0.0.0)
	npm run start-open

build: ## type-check (tsc --noEmit) + production build to dist/
	npm run build

preview: ## serve the production build locally
	npm run preview

test: ## vitest, single run (CI-friendly)
	npm test

test-coverage: ## vitest with v8 coverage; fails below the 80% thresholds
	npm run test:coverage

test-watch: ## vitest in watch mode
	npm run test:watch

lint: ## eslint over the repo
	npm run lint
