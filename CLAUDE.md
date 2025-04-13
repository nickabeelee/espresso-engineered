# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Run application: `poetry run start`
- Install dependencies: `poetry install`

## Code Style Guidelines
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

## Project Structure
- Main code: `app/`
- Models: `app/models/`
- API routes: `app/routes/`