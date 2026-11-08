<img src="public/logo.svg" alt="GreenPlate" width="200"/>

# GreenPlate

> Cloud-native vegetarian recipe platform demonstrating modern full-stack development, DevOps automation, observability, and secure API integration.

---

## 📖 Overview

GreenPlate is a serverless web application that enables users to discover vegetarian recipes, find recipes based on available ingredients, save favorites, and generate PDF cookbooks.

The project demonstrates a complete software delivery lifecycle, from local development and testing through automated deployment, monitoring, and incident response.

### Key Engineering Objectives

- Secure API consumption through a serverless proxy
- Redis-backed rate limiting and quota protection
- Containerized local execution with Docker
- Automated CI/CD using GitHub Actions and Vercel
- Production monitoring and alerting
- Multi-environment deployment strategy
- Cloud-native architecture and operational resilience

---

## ✨ Features

### 🔎 Recipe Discovery

- Vegetarian recipe search powered by Spoonacular
- Live search autocomplete
- Detailed ingredients and cooking instructions
- Input validation and sanitization

### 🥦 MyFridge Ingredient Matching

- Search recipes using available ingredients
- Dynamic relevance-based ranking
- Missing ingredient comparison

### ❤️ Favorites & Offline Support

- Persistent favorites using Local Storage
- Cached recipe availability during outages or quota exhaustion
- Offline browsing support

### 📄 PDF Cookbook Generation

- Export individual recipes to PDF
- Generate cookbooks containing up to 30 favorite recipes

### 🛡 API Protection & Rate Limiting

- Server-side Spoonacular API protection
- Feature-specific request quotas
- Upstash Redis rate limiting
- Fail-closed architecture for enhanced security

---

# 🏗 Architecture

## High-Level System Design

```text
[ Browser ]
      │
      ▼
[ React Frontend ]
      │
      ▼
[ Vercel Serverless Functions ]
      │
      ├── Upstash Redis
      │      Rate Limiting
      │
      └── Spoonacular API
             Recipe Data
```

---

## 🚀 CI/CD Pipeline

```text
Developer
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ├── ESLint
    ├── Vitest
    ├── Production Build
    └── Docker Build Validation
    │
    ▼
Vercel Deployment
    │
    ▼
Production Environment
    │
    ├── Sentry Monitoring
    └── UptimeRobot Availability Checks
```

---

# 🌍 Environment Strategy

| Environment | Purpose | Access |
|------------|------------|------------|
| Development | Local development and debugging | localhost |
| Staging | Pull request validation and QA | Vercel Preview Deployments |
| Production | Public-facing deployment | https://flg-greenplate.vercel.app |

### Configuration Matrix

| Configuration | Development | Staging | Production |
|------------|------------|------------|------------|
| Runtime | Local Vercel | Vercel Preview | Vercel Production |
| Monitoring | Optional | Enabled | Enabled |
| Redis | Development DB | Staging DB | Production DB |
| Error Tracking | Sentry Development | Sentry Staging | Sentry Production |

---

# ⚙️ Technology Stack

| Layer | Technology |
|---------|---------|
| Frontend | React 18, Tailwind CSS |
| HTTP Client | Axios |
| Build Tool | Vite |
| Testing | Vitest |
| Backend | Vercel Serverless Functions |
| Rate Limiting | Upstash Redis |
| Monitoring & Observability | Sentry, Vercel Logs |
| Availability Monitoring | UptimeRobot |
| CI/CD | GitHub Actions |
| Containerization | Docker, Nginx |
| Deployment | Vercel |
| PDF Generation | jsPDF |

---

# 🏛 Architecture Decisions

| Decision | Justification |
|-----------|-----------|
| Vercel Functions | Eliminate backend infrastructure management while protecting API credentials |
| Upstash Redis | Serverless-compatible rate limiting with REST API support |
| GitHub Actions | Native CI/CD integration with automated quality gates |
| Docker & Nginx | Reproducible builds and production-like local validation |
| Sentry | Centralized application error monitoring |
| UptimeRobot | Independent uptime monitoring |
| Multi-Environment Deployment | Safe separation of development, testing, and production workloads |

---

# 🔒 Security Controls

The application implements multiple security controls:

- Spoonacular API credentials never exposed to the browser
- All external API requests routed through a serverless proxy
- Redis-backed server-side rate limiting
- Environment-based configuration management
- GitHub Repository Secrets for credential storage
- Fail-closed design when Redis becomes unavailable
- Production monitoring and alerting for rapid issue detection

---

# 📊 Monitoring & Incident Response

## Sentry Error Monitoring

### Alert Triggers

- React runtime exceptions
- Unhandled API request failures
- Client-side crashes
- Serverless execution errors

### Resolution Workflow

1. Review issue details in Sentry
2. Analyze stack trace, breadcrumbs, and environment metadata
3. Reproduce locally
4. Implement and validate a fix
5. Push update and allow CI/CD execution
6. Verify successful deployment
7. Confirm resolution in Sentry

---

## UptimeRobot Availability Monitoring

### Monitored Endpoint

```text
https://flg-greenplate.vercel.app
```

### Monitoring Frequency

```text
Every 5 minutes
```

### Resolution Workflow

1. Check Vercel platform status
2. Review recent GitHub Actions workflows
3. Analyze Vercel runtime logs
4. Verify Upstash Redis availability
5. Verify Spoonacular API status and quota
6. Roll back deployment if required
7. Confirm recovery after HTTP 200 restoration

---

# 💻 Getting Started

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop
- Vercel CLI

Install the Vercel CLI:

```bash
npm install -g vercel
```

---

## Installation

```bash
git clone https://github.com/filos93/greenplate.git

cd greenplate

npm install
```

---

## Environment Variables

Create:

```bash
.env.local
```

Example configuration:

```env
SPOONACULAR_API_KEY=your_spoonacular_api_key

UPSTASH_REDIS_REST_URL=https://your-db.upstash.io

UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

---

# ▶️ Running Locally

## Full-Stack Development

```bash
npm run vercel:dev
```

Application URL:

```text
http://localhost:3000
```

---

## Docker Deployment

```bash
docker compose up --build -d
```

Access:

```text
http://localhost:8080
```

---

## Frontend-Only Development

```bash
npm run dev
```

Access:

```text
http://localhost:5173
```

---

# 📜 Available Scripts

```bash
npm run dev
npm run vercel:dev

npm run build
npm run preview

npm run lint

npm run test
npm run test:watch
```

---

# 📁 Project Structure

```text
greenplate/
├── .github/
│   └── workflows/
├── api/
│   └── spoonacular.js
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   └── utils/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
└── vite.config.js
```

---

# 🌐 Live Demo

### Application

https://flg-greenplate.vercel.app

### CI/CD Pipeline

*(Insert a link to a successful GitHub Actions workflow run.)*

---

# 📄 License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

# 👨‍💻 Author

**Filippo La Greca**

---

# 🙏 Acknowledgements

- Spoonacular API
- Upstash Redis
- React
- Vite
- Docker
- Nginx
- Vercel
- GitHub Actions
- Sentry
- UptimeRobot