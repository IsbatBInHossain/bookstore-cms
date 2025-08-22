# Headless Bookstore CMS (MVP)

This is a modern, headless, microservices-based e-commerce platform for selling books. The project is currently in the MVP development phase, with the initial focus on building the core `account-service`.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **Architecture:** Microservices
- **Containerization:** Docker & Docker Compose
- **Languages:** TypeScript (Node.js), Go (planned)
- **Database:** PostgreSQL
- **Primary Services (Node.js):**
  - **Framework:** Express.js
  - **ORM:** Prisma

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Running the Development Environment

The entire development stack is managed by Docker Compose and pnpm.

**1. Start the Database:**
The PostgreSQL database runs in a Docker container. Start it in the background:

```bash
docker compose up -d
```

**2. Install Dependencies:**
From the root of the project, install all dependencies for all services and packages:

```bash
pnpm install
```

**3. Run the Services:**
Start all microservices in development/watch mode with a single command:

```bash
pnpm dev
```

Turborepo will find and run the dev script for each service in the apps/ directory.
Project Structure

- apps/: Contains the individual, deployable microservices.
  - account-service: Manages users, authentication, and authorization.
- packages/: Contains shared libraries and configurations used by the services.
  - logger: A shared, pre-configured logger package.
- docker-compose.yml: Defines the development environment, including the shared database.
