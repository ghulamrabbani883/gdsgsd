# Elexon Wind Intelligence

A full-stack wind generation forecasting and accuracy analytics platform built using React, TypeScript, Python, FastAPI, PostgreSQL and Docker.

**Live Application:** `https://gdsgsd-five.vercel.app/`  
**Backend API:** `https://elexon-wind-api-3eii.onrender.com/`  
**API Documentation:** `https://elexon-wind-api-3eii.onrender.com/docs`

---

## 1. Project Overview

Elexon Wind Intelligence is a pilot analytics platform designed for a UK energy utility's day-ahead electricity procurement team.

Wind generation is weather-dependent, making accurate forecasts important when planning electricity purchases ahead of delivery.

The application uses historical actual wind generation and forecast data from Elexon to help users:

- Understand the latest eligible day-ahead wind generation forecast.
- Review forecast publication times and delivery periods.
- Quantitatively evaluate forecast accuracy.
- Identify systematic overforecasting or underforecasting.
- Understand how forecast accuracy changes with forecast lead time.
- Review forecast publication history and evolution.

The analysis covers national-level wind generation for January 2026.

## 2. Key Features

### Day-Ahead Forecast Intelligence
- Displays the selected delivery date's day-ahead forecast.
- Applies an illustrative previous-day 12:00 UK decision cutoff.
- Displays forecast publication timestamps.
- Provides hourly forecast generation values.
- Allows users to select different delivery dates.

### Forecast Accuracy Analytics
Calculates the following metrics:

- **MAE:** Mean Absolute Error.
- **RMSE:** Root Mean Squared Error.
- **Bias:** Average forecast error.
- **MAPE:** Mean Absolute Percentage Error.

Forecast error is calculated as:

`Forecast Error = Forecast Generation - Actual Generation`

Positive bias indicates overforecasting; negative bias indicates underforecasting.

MAPE excludes observations where actual generation is zero.

### Daily Accuracy
Displays forecast accuracy across individual delivery days to help identify periods with higher forecast errors.

### Lead-Time Accuracy
Evaluates forecast accuracy across different publication-to-delivery lead-time buckets:

- 0–6 hours
- 6–12 hours
- 12–18 hours
- 18–24 hours
- 24–36 hours
- 36–48 hours
- 48+ hours

These results use eligible forecast vintage/actual observations, not unique delivery intervals.

### Forecast Evolution
Displays how forecast values change across publication vintages for a selected delivery interval.

Only forecasts published before the delivery interval are considered.

### Data Quality
Provides visibility into expected periods, available actuals, selected forecasts, matched periods and data coverage.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, custom CSS |
| Charts | Recharts |
| API Integration | Axios |
| Server State | TanStack Query |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Database Driver | Psycopg 3 |
| HTTP Client | HTTPX |
| Containerization | Docker, Docker Compose |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Render PostgreSQL |

---

## 4. Architecture

The application follows a separated frontend/backend architecture.

```text
                  User Browser
                       |
                       v
                React Frontend
                   (Vercel)
                       |
                 HTTP REST API
                       |
                       v
                 FastAPI Backend
                   (Render)
                       |
                       v
                  SQLAlchemy
                       |
                       v
                  PostgreSQL
                   (Render)
                       ^
                       |
               Elexon BMRS API
               FUELHH / WINDFOR
```

### Data Flow

1. Actual wind generation and forecast data are retrieved from Elexon's BMRS API.
2. The ingestion service parses and normalizes timestamps.
3. Actual generation and forecast vintages are stored in PostgreSQL.
4. The analytics service aggregates actual generation and matches forecasts with actuals.
5. FastAPI exposes dashboard, forecast and analytics endpoints.
6. React retrieves the data and displays interactive visualizations.

---

## 5. Data Sources

The project uses Elexon BMRS API datasets exclusively.

### Actual Generation — FUELHH

API documentation:

https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream

Relevant fields:

- `startTime`: Actual generation settlement interval.
- `generation`: Actual generation in MW.
- `fuelType`: Filtered to `WIND`.

The actual generation dataset has a 30-minute resolution.

### Forecast Generation — WINDFOR

API documentation:

https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream

Relevant fields:

- `startTime`: Forecast delivery interval.
- `publishTime`: Forecast publication timestamp.
- `generation`: Forecast generation in MW.

Forecast publication timestamps are retained to support forecast vintage analysis.

### Analysis Period

- Delivery period: 1 January 2026 – 31 January 2026.
- Actual generation resolution: 30 minutes.
- Forecast generation resolution: Hourly.
- Forecast ingestion publication window starts on 30 December 2025 to capture pre-delivery forecasts for the beginning of January.

---

## 6. Data Processing and Methodology

### Actual Generation Aggregation

Actual generation is available at 30-minute resolution, whereas the forecast analysis is hourly.

Two consecutive half-hour actual observations are averaged to produce one hourly actual value:

`Hourly Actual = (Actual at HH:00 + Actual at HH:30) / 2`

Only complete hourly buckets with both non-null observations are included.

### Day-Ahead Forecast Selection

For each delivery date, the application selects the latest eligible forecast published no later than the illustrative previous-day 12:00 UK cutoff.

The cutoff is configurable through:

`DECISION_CUTOFF_HOUR`

This is an analytical assumption for the pilot and is not represented as an official market trading deadline.

### Forecast Vintage Analysis

Forecast publication time and delivery time are retained separately.

Forecast evolution and lead-time calculations use publication timestamps to distinguish forecast vintages.

Forecasts published at or after their delivery interval are excluded from pre-delivery accuracy analysis.

### Accuracy Metrics

Let:

`Error = Forecast - Actual`

- MAE measures average absolute forecast error.
- RMSE penalizes larger forecast errors more heavily.
- Bias measures the direction of forecast error.
- MAPE measures percentage error, excluding zero actual values.

---

## 7. Project Structure

```text
Elexon/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── dashboard.py
│   │   │       ├── forecasts.py
│   │   │       ├── analytics.py
│   │   │       └── utils.py
│   │   │
│   │   ├── database/
│   │   │   └── db.py
│   │   │
│   │   ├── models/
│   │   │   ├── actual.py
│   │   │   └── forecast.py
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── services/
│   │   │   ├── elexon_service.py
│   │   │   ├── ingestion_service.py
│   │   │   ├── forecast_service.py
│   │   │   └── analytics_service.py
│   │   │
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── scripts/
│   │   ├── ingest_january_data.py
│   │   ├── verify_database.py
│   │   ├── inspect_elexon_api.py
│   │   ├── inspect_forecast_window.py
│   │   └── verify_time_alignment.py
│   │
│   ├── tests/
│   │   └── test_analytics.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── forecasts/
│   │   │   └── common/
│   │   │
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

### Backend Responsibilities

- `main.py`: FastAPI application initialization and router registration.
- `config.py`: Application configuration and environment settings.
- `database/db.py`: SQLAlchemy engine, session management and database dependency.
- `models/`: Database models for actual and forecast generation.
- `elexon_service.py`: Communication with Elexon BMRS APIs.
- `ingestion_service.py`: Data ingestion, timestamp normalization and persistence.
- `forecast_service.py`: Forecast selection and publication-vintage handling.
- `analytics_service.py`: Actual aggregation, forecast matching and accuracy calculations.
- `routes/`: REST API endpoints.
- `scripts/`: Ingestion, inspection and database verification utilities.
- `tests/`: Automated analytics tests.

### Frontend Responsibilities

- `components/`: Reusable dashboard, chart, layout and forecast components.
- `hooks/`: TanStack Query hooks for API data retrieval.
- `services/api.ts`: Centralized Axios API client.
- `types/`: TypeScript interfaces for API responses.
- `utils/`: Formatting utilities.
- `styles/`: Application styling.
- `App.tsx`: Main dashboard composition.

---

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/forecasts/latest` | Latest eligible forecasts |
| GET | `/api/forecasts/evolution` | Forecast publication history |
| GET | `/api/analytics/accuracy` | Overall accuracy metrics |
| GET | `/api/analytics/daily` | Daily accuracy |
| GET | `/api/analytics/lead-time` | Lead-time accuracy |

Interactive API documentation is available at:

`https://elexon-wind-api-3eii.onrender.com/docs`

---

## 9. Running Locally

### Prerequisites

- Python 3.9+
- Node.js and npm
- Docker Desktop
- Git

### Clone the repository

```bash
git clone https://github.com/ghulamrabbani883/gdsgsd
cd Elexon
```

### Configure Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` and configure the database URL.

### Start PostgreSQL and Backend with Docker

From the project root:

```bash
docker compose up --build -d
```

### Ingest January 2026 Data

```bash
docker compose exec backend python scripts/ingest_january_data.py
```

### Verify Database

```bash
docker compose exec backend python scripts/verify_database.py
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env` using `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Start the development server:

```bash
npm run dev
```

Frontend:

`http://localhost:5173`

Backend API:

`http://localhost:8000`

API documentation:

`http://localhost:8000/docs`

---

## 10. Environment Variables

### Backend

| Variable | Description |
|---|---|
| `APP_NAME` | Application name |
| `APP_ENV` | Application environment |
| `API_PREFIX` | API route prefix |
| `DATABASE_URL` | PostgreSQL connection string |
| `ELEXON_API_BASE_URL` | Elexon API base URL |
| `DECISION_CUTOFF_HOUR` | Illustrative day-ahead decision cutoff |
| `HTTP_TIMEOUT_SECONDS` | HTTP request timeout |
| `CORS_ORIGINS` | Allowed frontend origins |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | FastAPI base URL |

Never commit real `.env` files, database passwords or API credentials.

---

## 11. Docker

The project uses Docker Compose to run:

- FastAPI backend.
- PostgreSQL database.

Useful commands:

```bash
# Build and start
docker compose up --build -d

# View services
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

The frontend runs separately through Vite during local development.

---

## 12. Deployment

The application is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Render PostgreSQL

Live application:

`https://gdsgsd-five.vercel.app`

Backend:

`https://elexon-wind-api-3eii.onrender.com`

---

## 13. Assumptions and Limitations

- Analysis is restricted to national-level wind generation data from Elexon.
- The analysis period covers January 2026.
- The previous-day 12:00 UK cutoff is an illustrative decision assumption, not an official market deadline.
- Forecast and actual generation are compared at hourly resolution.
- Hourly actual generation requires both half-hour observations.
- MAPE excludes zero actual generation values.
- Forecast vintage analysis excludes forecasts published at or after the delivery interval.
- Historical forecast availability is limited by the available publication window.
- The application does not incorporate electricity demand, wholesale prices, other generation sources, balancing costs or actual procurement transactions.
- Procurement requirements and financial savings are therefore not calculated. Any surplus or shortfall interpretation is illustrative and based only on wind forecast information.

---

## 14. AI Tools Disclosure

AI-assisted development tools, including ChatGPT, were used during the development process for coding assistance, debugging, implementation guidance and documentation.

The application architecture, technical decisions, integration, validation and final implementation were reviewed and tested as part of the development process.

---

## 15. Project Objective

The objective of this pilot is to demonstrate how historical renewable generation forecasts and actual generation data can be transformed into actionable forecast intelligence for a day-ahead electricity procurement team.

The application provides visibility into forecast availability, forecast uncertainty, systematic bias and accuracy across different lead times, helping users make more informed decisions when assessing renewable generation availability.
