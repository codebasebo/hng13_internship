# Country Currency & Exchange API

A RESTful API that fetches country data from external APIs, stores it in a LowDB database, and provides CRUD operations with exchange rate calculations.

## Features

- Fetch country data from RestCountries API
- Retrieve exchange rates from Open Exchange Rates API
- Calculate estimated GDP for each country
- Store and manage country data in LowDB (JSON-based database)
- Generate summary images with country statistics
- Support filtering and sorting
- Comprehensive error handling

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **LowDB** - JSON database
- **Axios** - HTTP client
- **Canvas** - Image generation
- **dotenv** - Environment configuration

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- System dependencies for canvas:
  ```bash
  sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pkg-config
  ```

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd backend-stage2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the root directory:
   ```bash
   PORT=4000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### 1. Refresh Countries Data
**POST** `/countries/refresh`

Fetches all countries and exchange rates, then caches them in the database.

**Response:**
```json
{
  "message": "Countries refreshed successfully",
  "total": 250,
  "last_refreshed_at": "2025-10-31T12:00:00Z"
}
```

### 2. Get All Countries
**GET** `/countries`

Get all countries from the database with optional filters and sorting.

**Query Parameters:**
- `region` - Filter by region (e.g., `?region=Africa`)
- `currency` - Filter by currency code (e.g., `?currency=NGN`)
- `sort` - Sort results (e.g., `?sort=gdp_desc`)

**Example:**
```bash
GET /countries?region=Africa&sort=gdp_desc
```

**Response:**
```json
[
  {
    "id": "nigeria",
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-31T12:00:00Z"
  }
]
```

### 3. Get Country by Name
**GET** `/countries/:name`

Get a specific country by name.

**Example:**
```bash
GET /countries/Nigeria
```

### 4. Delete Country
**DELETE** `/countries/:name`

Delete a country record from the database.

**Example:**
```bash
DELETE /countries/Nigeria
```

**Response:**
```json
{
  "message": "Country deleted successfully"
}
```

### 5. Get Status
**GET** `/status`

Show total countries and last refresh timestamp.

**Response:**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-31T12:00:00Z"
}
```

### 6. Get Summary Image
**GET** `/countries/image`

Serve the generated summary image with country statistics.

**Response:** PNG image file or error if not found.

## Data Fields

Each country record contains:
- `id` - Auto-generated (lowercase country name)
- `name` - Country name (required)
- `capital` - Capital city (optional)
- `region` - Geographic region (optional)
- `population` - Population count (required)
- `currency_code` - Currency code like NGN, USD (required)
- `exchange_rate` - Exchange rate vs USD (required)
- `estimated_gdp` - Calculated as: `population × random(1000-2000) ÷ exchange_rate`
- `flag_url` - Country flag URL (optional)
- `last_refreshed_at` - Timestamp of last refresh

## Currency Handling

- If a country has multiple currencies, only the first is stored
- If no currency exists:
  - `currency_code` = null
  - `exchange_rate` = null
  - `estimated_gdp` = 0
  - Country is still stored
- If currency not found in exchange rates:
  - `exchange_rate` = null
  - `estimated_gdp` = null
  - Country is still stored

## Error Responses

```json
// 404 Not Found
{
  "error": "Country not found"
}

// 400 Bad Request
{
  "error": "Validation failed",
  "details": {
    "currency_code": "is required"
  }
}

// 503 Service Unavailable
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from RestCountries API"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

## Project Structure

```
backend-stage2/
├── src/
│   ├── controllers/
│   │   └── countryController.js
│   ├── routes/
│   │   └── countryRoutes.js
│   ├── db/
│   │   └── database.js
│   ├── utils/
│   │   └── imageGenerator.js
│   ├── app.js
│   └── server.js
├── data/
│   └── db.json
├── cache/
│   └── summary.png
├── .env
├── package.json
└── README.md
```

## Development

### Running Tests
```bash
npm test
```

### Testing Endpoints

Using curl:
```bash
# Refresh countries
curl -X POST http://localhost:4000/countries/refresh

# Get all countries
curl http://localhost:4000/countries

# Get countries in Africa
curl http://localhost:4000/countries?region=Africa

# Get status
curl http://localhost:4000/status

# Get summary image
curl http://localhost:4000/countries/image --output summary.png
```

## External APIs

- **Countries API:** https://restcountries.com/v2/all
- **Exchange Rates API:** https://open.er-api.com/v6/latest/USD

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4000 |
| NODE_ENV | Environment | development |

## Deployment

This API can be deployed on:
- Railway
- Heroku
- AWS (EC2, Elastic Beanstalk)
- DigitalOcean
- Any VPS with Node.js support

**Note:** Vercel and Render are not recommended for this project.

## License

ISC

## Author

[Your Name]

## Support

For issues or questions, please open an issue in the GitHub repository.
