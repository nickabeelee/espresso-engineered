# Espresso Engineered - Backend

A FastAPI application for managing espresso-related data with Supabase integration.

## Project Overview

Espresso Engineered manages coffee equipment, beans, and brewing data through a RESTful API. The backend tracks:

- Roasters and their coffee beans
- Coffee bags purchased from roasters
- Espresso machines and grinders
- Baristas and their brew records
- Grinder setting suggestions for beans and bags

## Dependencies

- Python 3.13+
- FastAPI 0.115.x
- Supabase 2.15.x
- Pydantic 2.11.x with email validation
- Poetry for dependency management

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   cd backend && poetry install
   ```
3. Create a `.env` file in the backend directory with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   APP_PORT=8000 (optional)
   DEBUG=False (optional)
   ```
4. Run the application:
   ```
   poetry run start
   ```

## Project Structure

- `app/main.py` - FastAPI application setup and router registration
- `app/config.py` - Environment configuration 
- `app/supabase.py` - Supabase client setup
- `app/enums.py` - Project enumerations (e.g., RoastLevel)
- `app/models/` - Pydantic models for data validation
- `app/routes/` - API route handlers organized by resource

## API Endpoints

RESTful endpoints for all resources including:

- `/beans/` - Coffee bean management
- `/roasters/` - Coffee roaster management
- `/machines/` - Espresso machine management
- `/grinders/` - Grinder management
- `/bags/` - Coffee bag management
- `/baristas/` - Barista management
- `/brews/` - Brewing record management
- `/bean_grinder_suggestions/` - Grinder setting suggestions for beans
- `/bag_grinder_suggestions/` - Grinder setting suggestions for bags