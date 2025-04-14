# Espresso Engineered

A comprehensive application for coffee enthusiasts to track their espresso brewing journey.

## Project Structure

This is a monorepo containing both frontend and backend code:

- `/backend`: FastAPI application
- `/frontend`: React + TypeScript application

## Backend (FastAPI)

The backend is a Python application built with FastAPI, providing RESTful APIs for managing coffee beans, brews, equipment, and more.

### Getting Started

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies using Poetry:
   ```
   poetry install
   ```

3. Run the application:
   ```
   poetry run start
   ```

4. The API will be available at http://localhost:8000
   - API documentation: http://localhost:8000/docs
   - ReDoc API documentation: http://localhost:8000/redoc

## Frontend (React + TypeScript)

The frontend is a modern React application written in TypeScript, providing a user-friendly interface for interacting with the backend.

### Getting Started

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The application will be available at http://localhost:5173

## Development

See the [CLAUDE.md](./CLAUDE.md) file for detailed development guidelines, code style, and project structure information.

## License

[MIT License](LICENSE)
EOF < /dev/null