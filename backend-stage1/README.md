# String Analyzer Service - Stage 1

A RESTful API service that analyzes strings and stores their computed properties including length, palindrome detection, character frequency, SHA-256 hash, and more.

## Features

- ✅ String analysis with multiple computed properties
- ✅ SHA-256 hash-based unique identification
- ✅ Advanced filtering (palindromes, length, word count, character search)
- ✅ Natural language query parsing
- ✅ Persistent JSON-based storage

## API Endpoints

### 1. Create/Analyze String
**POST** `/strings`

Request:
```json
{
  "value": "string to analyze"
}
```

Response (201 Created):
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
    "character_frequency_map": { "s": 2, "t": 3, ... }
  },
  "created_at": "2025-10-24T10:00:00Z"
}
```

### 2. Get Specific String
**GET** `/strings/{string_value}`

Response (200 OK): Returns the full string record

### 3. Get All Strings with Filtering
**GET** `/strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a`

Query Parameters:
- `is_palindrome` (boolean): Filter palindromes
- `min_length` (integer): Minimum string length
- `max_length` (integer): Maximum string length
- `word_count` (integer): Exact word count
- `contains_character` (string): Single character to search for

### 4. Natural Language Filtering
**GET** `/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings`

Supported queries:
- "all single word palindromic strings"
- "strings longer than 10 characters"
- "palindromic strings that contain the letter z"
- "strings containing the first vowel"

Response (200 OK):
```json
{
  "data": [ /* array of matching strings */ ],
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

### 5. Delete String
**DELETE** `/strings/{string_value}`

Response (204 No Content): Empty response on success

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/codebasebo/hng13_internship.git
cd hng13_internship/backend-stage1
```

2. Install dependencies:
```bash
npm install
```

### Dependencies
- `express` (v5.1.0) - Web framework
- `lowdb` (v7.0.1) - JSON database
- `dayjs` (v1.11.18) - Date/time handling
- `crypto` (v1.0.1) - SHA-256 hashing
- `body-parser` (v2.2.0) - Request body parsing

### Environment Variables
- `PORT` (optional): Server port (default: 3000)

Create a `.env` file (optional):
```
PORT=3000
```

## Running Locally

### Development Mode
```bash
npm start
# or
node server.js
```

The server will start at `http://localhost:3000`

### Test the API

Health check:
```bash
curl http://localhost:3000/
```

Create a string:
```bash
curl -X POST http://localhost:3000/strings \
  -H "Content-Type: application/json" \
  -d '{"value":"racecar"}'
```

Get all strings:
```bash
curl http://localhost:3000/strings
```

Filter palindromes:
```bash
curl "http://localhost:3000/strings?is_palindrome=true"
```

Natural language query:
```bash
curl "http://localhost:3000/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings"
```

## Project Structure
```
backend-stage1/
├── server.js              # Entry point
├── package.json           # Dependencies
├── src/
│   ├── app.js            # Express app setup
│   ├── controllers/
│   │   ├── stringController.js           # CRUD operations
│   │   └── naturalLanguageController.js  # NL query parsing
│   ├── services/
│   │   └── stringService.js              # String analysis logic
│   ├── routes/
│   │   └── stringRoutes.js               # API routes
│   └── db/
│       ├── connection.js                  # Database setup
│       └── db.json                        # Data storage
```

## Error Responses

- **400 Bad Request**: Invalid request body or query parameters
- **404 Not Found**: String does not exist
- **409 Conflict**: String already exists
- **422 Unprocessable Entity**: Invalid data type or conflicting filters

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: LowDB (JSON file-based)
- **Hashing**: crypto (SHA-256)

## Deployment
This service can be deployed to:
- Railway
- Heroku
- AWS (EC2, Lambda, Elastic Beanstalk)
- DigitalOcean App Platform
- Google Cloud Platform

**Note**: Vercel and Render are not permitted per cohort requirements.

## Author
Backend Stage 1 - HNG13 Internship

## License
ISC
