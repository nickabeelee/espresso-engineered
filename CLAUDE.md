# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure
- **Backend**: FastAPI application in `/backend`
- **Frontend**: React + TypeScript application in `/frontend`

## Backend (FastAPI)

### Build Commands
- Run application: `cd backend && poetry run start`
- Install dependencies: `cd backend && poetry install`

### Code Style Guidelines
- **Imports**: Standard first, third-party second, local app imports last. Group and alphabetize within groups.
- **Types**: Use type hints consistently. Pydantic models for data validation.
- **Naming**: 
  - Classes: PascalCase (e.g., `BeanCreate`)
  - Functions/methods/variables: snake_case (e.g., `get_beans`)
  - Constants: UPPER_SNAKE_CASE
- **Error Handling**: Use try/except in route handlers. Raise HTTPException with appropriate status codes.
- **Models**: Extend Pydantic's BaseModel. Separate read models from create/update models.
- **API Structure**: Organize routers by resource type. Follow RESTful patterns.
- **Environment**: Load variables from `.env` file. Check app/config.py for available settings.

### Backend Structure
- Main code: `backend/app/`
- Models: `backend/app/models/`
- API routes: `backend/app/routes/`

## Frontend (React + TypeScript)

### Build Commands
- Install dependencies: `cd frontend && npm install`
- Start development server: `cd frontend && npm run dev`
- Build for production: `cd frontend && npm run build`

### Code Style Guidelines
- **Imports**: React imports first, third-party second, local components/utilities last.
- **Types**: Use TypeScript interfaces and types consistently.
- **Components**: Use functional components with hooks.
- **Naming**:
  - Components: PascalCase (e.g., `BeanDetail`)
  - Functions/variables: camelCase (e.g., `fetchBeans`)
  - Constants: UPPER_SNAKE_CASE
- **State Management**: Use React context and hooks for state management.
- **Styling**: Use CSS modules or styled-components.

### Frontend Structure
- Source code: `frontend/src/`
- Components: `frontend/src/components/`
- Pages/Routes: `frontend/src/pages/`
- API clients: `frontend/src/api/`
- Types: `frontend/src/types/`