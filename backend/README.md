# Espresso Engineered Backend

Fastify-based backend API for the Espresso Engineered brew logging system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your Supabase credentials

## Development

Start the development server:
```bash
npm run dev
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Docker

Build Docker image:
```bash
docker build -t espresso-engineered-backend .
```

Run container:
```bash
docker run -p 3000:3000 espresso-engineered-backend
```

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API information
- Additional endpoints will be documented as they are implemented

## Architecture

- **Framework**: Fastify with TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: JWT tokens from Supabase Auth
- **Testing**: Jest with fast-check for property-based testing