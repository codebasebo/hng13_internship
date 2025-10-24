# Backend String Analyzer Service

This is a RESTful API that analyzes strings and computes various properties such as length, whether the string is a palindrome, word count, and more. It provides endpoints to create, retrieve, filter, and delete strings, as well as a natural language filtering feature for more user-friendly search queries.

## Table of Contents

* [Overview](#overview)
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Setup Instructions](#setup-instructions)
* [API Endpoints](#api-endpoints)
  * [POST /strings](#post-strings)
  * [GET /strings/{string_value}](#get-stringsstring_value)
  * [GET /strings](#get-strings)
  * [GET /strings/filter-by-natural-language](#get-stringsfilter-by-natural-language)
  * [DELETE /strings/{string_value}](#delete-stringsstring_value)
* [Error Handling](#error-handling)
* [Testing](#testing)
* [Deployment](#deployment)
* [Project Structure](#project-structure)
* [License](#license)

## Overview

This project is a backend API that allows you to:

* Submit a string for analysis with computed properties (length, palindrome status, character frequency, etc.)
* Retrieve a string's analysis by its value
* Filter strings based on specific properties like palindrome status, word count, length, and characters
* Use natural language filtering to search for strings based on user-friendly queries
* Delete strings from the database

## Technologies Used

* **Node.js** (v16 or higher): Runtime environment for executing JavaScript code
* **Express.js** (v5.1.0): Web framework for building RESTful APIs
* **LowDB** (v7.0.1): Lightweight JSON database for data persistence
* **crypto**: Built-in Node.js module for SHA-256 hashing
* **dayjs** (v1.11.18): Date/time handling library
* **body-parser** (v2.2.0): Request body parsing middleware

## Features

- ✅ String analysis with multiple computed properties
- ✅ SHA-256 hash-based unique identification
- ✅ Advanced filtering (palindromes, length, word count, character search)
- ✅ Natural language query parsing
- ✅ Persistent JSON-based storage
- ✅ RESTful API design with proper HTTP status codes

## Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

* [Node.js](https://nodejs.org/en/) (v16.x or higher)
* npm or yarn package manager

### 1. Clone the Repository

```bash
git clone https://github.com/codebasebo/hng13_internship.git
cd hng13_internship/backend-stage1
```

### 2. Install Dependencies

```bash
npm install
```

The following dependencies will be installed:
- `express` (v5.1.0) - Web framework
- `lowdb` (v7.0.1) - JSON database
- `dayjs` (v1.11.18) - Date/time handling
- `crypto` (v1.0.1) - SHA-256 hashing
- `body-parser` (v2.2.0) - Request body parsing

### 3. Set up Environment Variables (Optional)

Create a `.env` file in the root directory of the project if you want to customize the port:

```bash
PORT=3000
```

By default, the server runs on port 3000.

### 4. Run the Application

Start the development server:

```bash
npm start
# or
node server.js
```

The API will be running at `http://localhost:3000`.

### 5. Test the API

You can test the API using tools like **Postman**, **Insomnia**, or **curl**.

Health check:
```bash
curl http://localhost:3000/
```

## API Endpoints

## API Endpoints

### POST /strings

Create and analyze a new string.

#### Request Body

```json
{
  "value": "string to analyze"
}
```

#### Response (201 Created)

```json
{
  "id": "sha256_hash_value",
  "value": "string to analyze",
  "properties": {
    "length": 17,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2
    }
  },
  "created_at": "2025-10-24T10:00:00Z"
}
```

#### Error Responses:

* `400 Bad Request`: Missing "value" field
* `409 Conflict`: String already exists in the system
* `422 Unprocessable Entity`: Invalid data type for "value" (must be string)

**Example:**
```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value":"racecar"}'
```

---

### GET /strings/{string_value}

Retrieve the properties of a specific string by its value.

#### Response (200 OK)

```json
{
  "id": "sha256_hash_value",
  "value": "requested string",
  "properties": {
    "length": 17,
    "is_palindrome": false,
    "unique_characters": 12,
    "word_count": 3,
    "sha256_hash": "abc123...",
    "character_frequency_map": {
      "s": 2,
      "t": 3,
      "r": 2
    }
  },
  "created_at": "2025-10-24T10:00:00Z"
}
```

#### Error Response:

* `404 Not Found`: String does not exist in the system

**Example:**
```bash
curl http://localhost:3000/strings/racecar
```

---

### GET /strings

Retrieve all strings with optional query filters.

#### Query Parameters:
- `is_palindrome` (boolean): Filter palindromes (true/false)
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character to search for

#### Example Query:

```http
GET /strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "string1",
      "properties": {
        "length": 17,
        "is_palindrome": true,
        "unique_characters": 12,
        "word_count": 2,
        "sha256_hash": "abc123...",
        "character_frequency_map": { "s": 2, "t": 3 }
      },
      "created_at": "2025-10-24T10:00:00Z"
    }
  ],
  "count": 15,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5,
    "max_length": 20,
    "word_count": 2,
    "contains_character": "a"
  }
}
```

#### Error Response:

* `400 Bad Request`: Invalid query parameter values or types

**Examples:**
```bash
# Get all strings
curl http://localhost:3000/strings

# Filter palindromes only
curl "http://localhost:3000/strings?is_palindrome=true"

# Filter by length
curl "http://localhost:3000/strings?min_length=5&max_length=10"

# Filter by word count
curl "http://localhost:3000/strings?word_count=2"

# Filter by character
curl "http://localhost:3000/strings?contains_character=a"
```

---

### GET /strings/filter-by-natural-language

Search for strings using a natural language query.

#### Query Parameter:
- `query` (string): Natural language search query

#### Supported Queries:
- "all single word palindromic strings" → `word_count=1, is_palindrome=true`
- "strings longer than 10 characters" → `min_length=11`
- "palindromic strings that contain the letter z" → `is_palindrome=true, contains_character=z`
- "strings containing the first vowel" → `contains_character=a`

#### Example Query:

```http
GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings
```

#### Response (200 OK)

```json
{
  "data": [
    {
      "id": "hash1",
      "value": "racecar",
      "properties": {
        "length": 7,
        "is_palindrome": true,
        "unique_characters": 4,
        "word_count": 1,
        "sha256_hash": "e00f9ef...",
        "character_frequency_map": { "r": 2, "a": 2, "c": 2, "e": 1 }
      },
      "created_at": "2025-10-24T10:00:00Z"
    }
  ],
  "count": 3,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

#### Error Responses:

* `400 Bad Request`: Unable to parse natural language query
* `422 Unprocessable Entity`: Query parsed but resulted in conflicting filters

**Examples:**
```bash
# Single word palindromes
curl "http://localhost:3000/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"

# Strings longer than 5 characters
curl "http://localhost:3000/strings/filter-by-natural-language?query=strings%20longer%20than%205%20characters"

# Strings containing letter 'a'
curl "http://localhost:3000/strings/filter-by-natural-language?query=strings%20containing%20the%20letter%20a"
```

---

### DELETE /strings/{string_value}

Delete a string by its value.

#### Response (204 No Content)

Empty response body on success.

#### Error Response:

* `404 Not Found`: String does not exist in the system

**Example:**
```bash
curl -X DELETE http://localhost:3000/strings/racecar
```

---

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

### Success Codes:
* **200 OK**: Request succeeded
* **201 Created**: Resource successfully created
* **204 No Content**: Resource successfully deleted (no response body)

### Error Codes:
* **400 Bad Request**: Invalid or missing parameters in the request
* **404 Not Found**: Requested resource does not exist
* **409 Conflict**: Resource already exists (duplicate string)
* **422 Unprocessable Entity**: Request body or query parameters are invalid or conflicting

### Error Response Format:

```json
{
  "error": "Error message description"
}
```

Or with additional details:

```json
{
  "error": "Error message",
  "details": "Additional context about the error"
}
```

## Testing

### Manual Testing with curl

Test the health check endpoint:
```bash
curl http://localhost:3000/
```

Create a test string:
```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value":"racecar"}'
```

Retrieve all strings:
```bash
curl http://localhost:3000/strings
```

Test natural language filtering:
```bash
curl "http://localhost:3000/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"
```

### Testing with Postman or Insomnia

Import the following example requests:

1. **POST /strings** - Create String
2. **GET /strings** - Get All Strings
3. **GET /strings/:value** - Get Specific String
4. **GET /strings?is_palindrome=true** - Filter Palindromes
5. **GET /strings/filter-by-natural-language?query=...** - Natural Language Search
6. **DELETE /strings/:value** - Delete String

### Automated Testing

You can add automated tests using **Jest** or **Mocha**. Example test structure:

```bash
npm install --save-dev jest supertest
```

Create `tests/api.test.js`:
```javascript
const request = require('supertest');
const { app } = require('../src/app');

describe('String Analyzer API', () => {
  test('POST /strings should create a new string', async () => {
    const response = await request(app)
      .post('/strings')
      .send({ value: 'test' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.value).toBe('test');
  });

  test('GET /strings should return all strings', async () => {
    const response = await request(app)
      .get('/strings')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('count');
  });
});
```

Run tests:
```bash
npm test
```

## Deployment

### Deployed Instance

The API is currently deployed at:
**https://hng13internship-production.up.railway.app**

Test it:
```bash
curl https://hng13internship-production.up.railway.app/
```

### Deploy to Railway

This project is deployed on Railway. To deploy your own instance:

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   railway init
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Set environment variables (optional):**
   ```bash
   railway variables set PORT=3000
   ```

### Deploy to Other Platforms

#### Heroku

1. Create a `Procfile` in the root directory:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   heroku create
   git push heroku main
   ```

#### AWS (Elastic Beanstalk)

1. Install EB CLI
2. Initialize and deploy:
   ```bash
   eb init
   eb create
   eb deploy
   ```

#### DigitalOcean App Platform

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set run command: `npm start`

**Note**: Vercel and Render are not permitted per cohort requirements.

## Project Structure

```
backend-stage1/
├── server.js                          # Entry point
├── package.json                       # Dependencies and scripts
├── README.md                          # This file
├── .gitignore                         # Git ignore rules
├── src/
│   ├── app.js                        # Express app setup
│   ├── controllers/
│   │   ├── stringController.js       # CRUD operations
│   │   └── naturalLanguageController.js  # NL query parsing
│   ├── services/
│   │   └── stringService.js          # String analysis logic
│   ├── routes/
│   │   └── stringRoutes.js           # API route definitions
│   └── db/
│       ├── connection.js             # LowDB setup
│       └── db.json                   # JSON database (auto-generated)
```

### Key Files:

* **server.js**: Application entry point, starts Express server
* **src/app.js**: Express configuration and middleware setup
* **src/controllers/**: Request handlers for each endpoint
* **src/services/stringService.js**: Core string analysis logic
* **src/routes/stringRoutes.js**: API route definitions
* **src/db/connection.js**: Database connection setup

## License

This project is licensed under the ISC License.

## Author

Backend Stage 1 - HNG13 Internship

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/codebasebo/hng13_internship/issues)
- Check the API documentation above
- Test endpoints using the deployed instance

---

**Live API**: https://hng13internship-production.up.railway.app

**Repository**: https://github.com/codebasebo/hng13_internship
