# Espresso Engineered - Frontend

The frontend application for Espresso Engineered, a coffee tracking system.

## Features

- Track coffee roasters and beans
- Create, read, update, and delete coffee data
- Responsive design using Tailwind CSS
- React Router for navigation
- React Query for efficient data fetching and caching
- Form handling with validation

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Static type checking
- **Vite** - Fast development and building
- **TanStack React Query** - Data fetching and caching
- **React Router** - Navigation
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js (version 18+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Environment Setup

Create a `.env` file in the frontend directory with the following:

```
VITE_API_URL=http://localhost:8000
```

Or adjust the URL to match your backend API address.

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

- `/src` - Source code
  - `/api` - API service functions
  - `/components` - Reusable UI components
  - `/pages` - Page components
  - `/types` - TypeScript interfaces and types
- `/public` - Static assets

## Features

### Pages

- **Home** - Dashboard with navigation to other sections
- **Roasters** - List, view, create, edit and delete coffee roasters
- **Beans** - List, view, create, edit and delete coffee beans

## Connecting to the Backend

The frontend connects to the FastAPI backend through Axios HTTP client. The base URL is configured in `/src/api/client.ts` and can be adjusted through environment variables.

All API requests include appropriate headers and error handling.
