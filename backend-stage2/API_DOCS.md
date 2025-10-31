# API Documentation

## Base URL
```
http://localhost:4000
```

## Endpoints

### 1. Refresh Countries
**POST** `/countries/refresh`

Fetches all countries from RestCountries API and exchange rates from Open Exchange Rates API, then stores them in the database.

**Request:**
```bash
curl -X POST http://localhost:4000/countries/refresh
```

**Success Response (200):**
```json
{
  "message": "Countries refreshed successfully",
  "total": 250,
  "last_refreshed_at": "2025-10-31T13:23:07.124Z"
}
```

**Error Response (503):**
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from RestCountries API"
}
```

---

### 2. Get All Countries
**GET** `/countries`

Retrieve all countries with optional filtering and sorting.

**Query Parameters:**
- `region` (optional) - Filter by region (e.g., `Africa`, `Europe`)
- `currency` (optional) - Filter by currency code (e.g., `NGN`, `USD`)
- `sort` (optional) - Sort results. Available: `gdp_desc`

**Examples:**
```bash
# Get all countries
curl http://localhost:4000/countries

# Get countries in Africa
curl "http://localhost:4000/countries?region=Africa"

# Get countries using USD
curl "http://localhost:4000/countries?currency=USD"

# Get African countries sorted by GDP
curl "http://localhost:4000/countries?region=Africa&sort=gdp_desc"
```

**Success Response (200):**
```json
[
  {
    "id": "nigeria",
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139587,
    "currency_code": "NGN",
    "exchange_rate": 1440.226638,
    "estimated_gdp": 242032769.30154932,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-31T13:23:07.123Z"
  }
]
```

---

### 3. Get Country by Name
**GET** `/countries/:name`

Retrieve a specific country by name (case-insensitive).

**Example:**
```bash
curl http://localhost:4000/countries/Nigeria
```

**Success Response (200):**
```json
{
  "id": "nigeria",
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139587,
  "currency_code": "NGN",
  "exchange_rate": 1440.226638,
  "estimated_gdp": 242032769.30154932,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-10-31T13:23:07.123Z"
}
```

**Error Response (404):**
```json
{
  "error": "Country not found"
}
```

---

### 4. Delete Country
**DELETE** `/countries/:name`

Delete a country record from the database.

**Example:**
```bash
curl -X DELETE http://localhost:4000/countries/Tuvalu
```

**Success Response (200):**
```json
{
  "message": "Country deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Country not found"
}
```

---

### 5. Get Status
**GET** `/status`

Get the total number of countries in the database and last refresh timestamp.

**Example:**
```bash
curl http://localhost:4000/status
```

**Success Response (200):**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-31T13:23:07.124Z"
}
```

---

### 6. Get Summary Image
**GET** `/countries/image`

Retrieve the generated summary image showing:
- Total countries
- Top 5 countries by estimated GDP
- Last refresh timestamp

**Example:**
```bash
curl http://localhost:4000/countries/image --output summary.png
```

**Success Response (200):**
Returns a PNG image file.

**Error Response (404):**
```json
{
  "error": "Summary image not found"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - External API failure |

## Data Fields

Each country object contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier (lowercase name) |
| name | string | Yes | Country name |
| capital | string | No | Capital city |
| region | string | No | Geographic region |
| population | number | Yes | Population count |
| currency_code | string | Yes/No | Currency code (null if not available) |
| exchange_rate | number | Yes/No | Exchange rate vs USD (null if not available) |
| estimated_gdp | number | Yes | Calculated GDP estimate |
| flag_url | string | No | Country flag URL |
| last_refreshed_at | string | Yes | ISO 8601 timestamp |

## Currency Handling Rules

1. **Multiple currencies**: Only the first currency is stored
2. **No currency**: 
   - `currency_code` = null
   - `exchange_rate` = null
   - `estimated_gdp` = 0
3. **Currency not in exchange rates**:
   - `exchange_rate` = null
   - `estimated_gdp` = null

## GDP Calculation

```javascript
estimated_gdp = (population × random(1000-2000)) ÷ exchange_rate
```

The random multiplier (1000-2000) is regenerated on each refresh.

## External APIs Used

1. **RestCountries API**: `https://restcountries.com/v2/all`
2. **Open Exchange Rates API**: `https://open.er-api.com/v6/latest/USD`
