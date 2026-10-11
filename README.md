# QuickNotes System Design & API Dashboard

QuickNotes is an enterprise-grade note-taking solution designed to scale to 1 million users. This repository contains both a functional front-end API client connected to JSONPlaceholder and comprehensive system architecture and database design documentation for the production backend platform.

## Repository Contents & Documentation Links

- **API Client:** [`index.html`](index.html), [`api.js`](api.js), and [`style.css`](style.css)
- **REST API Specification:** [`docs/api-design.md`](docs/api-design.md)
- **Database Schema & Data Model:** [`docs/data-model.md`](docs/data-model.md)
- **System Architecture & Scaling Plan:** [`docs/architecture.md`](docs/architecture.md)

## How to Run the API Client Locally

1. Clone this repository:
   ```bash
   git clone [https://github.com/sherilkerubo/quicknotes-system-design.git](https://github.com/sherilkerubo/quicknotes-system-design.git)
   **Navigate into the project folder:
   cd quicknotes-system-design
   **Open index.html directly in any standard web browser, or launch it using the VS Code Live Server extension.
   ##What I Learned
Defensive Asynchronous API Integration: Implementing custom fetch wrappers with centralized status tracking, UI loading states, and robust try/catch/finally blocks prevents silent UI failures.

Relational Data Modeling & Indexing: Structuring junction tables (note_tags) to resolve M:N relationships and placing targeted B-Tree indexes on foreign keys dramatically optimizes query performance under heavy load.

High-Scale System Architecture Design: Balancing read/write throughput calculations, leveraging read replicas for eventual consistency, and eliminating single points of failure (SPOF) using load balancers and stateless application servers.