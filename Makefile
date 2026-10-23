.PHONY: dev-backend dev-frontend test test-backend test-frontend lint ingest docker-build docker-run

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

lint:
	cd backend && ruff check . && ruff format --check . && mypy app
	cd frontend && npm run lint && npm run format:check

ingest:
	cd backend && python -m app.data.ingest

docker-build:
	docker build -t windportal .

docker-run:
	docker run --rm -p 8000:8000 -e PORT=8000 windportal
