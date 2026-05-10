frontend-install:
	npm install
.PHONY: frontend-install

frontend-dev:
	npm run dev
.PHONY: frontend-dev

frontend-build:
	npm run build
.PHONY: frontend-build

frontend-lint:
	npm run lint
.PHONY: frontend-lint

frontend-typecheck:
	npm run typecheck
.PHONY: frontend-typecheck

frontend-test:
	npm run test
.PHONY: frontend-test

frontend-generate-api-types:
	npm run generate:api-types
.PHONY: frontend-generate-api-types

frontend-ci: frontend-lint frontend-typecheck frontend-test frontend-build
.PHONY: frontend-ci
