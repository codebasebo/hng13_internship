# TelexCodeBuddy - AI Code Assistant Agent

A powerful AI-driven code assistant that integrates with Telex.im to help developers with code reviews, explanations, refactoring suggestions, and code snippets.

## Overview

TelexCodeBuddy is an intelligent agent built with Node.js, Express, and Mastra that connects to the Telex.im platform via the A2A (Agent-to-Agent) protocol. It leverages intent classification and specialized handlers to provide context-aware assistance to developers.

### Features

- **Code Reviews**: Analyzes code for bugs, best practices, and performance issues
- **Explanations**: Explains programming concepts and code snippets
- **Refactoring Suggestions**: Recommends code improvements and optimizations
- **Snippet Generation**: Provides ready-to-use code examples for common tasks
- **Real-time Integration**: Seamlessly responds to messages on Telex.im

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Telex.im Platform                     │
└────────────────────────┬────────────────────────────────┘
                         │
                    A2A Protocol
                         │
┌────────────────────────▼────────────────────────────────┐
│              TelexCodeBuddy Server                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │    Express.js Server (Port 4000)                 │   │
│  │    POST /a2a/agent/telex-codebuddy             │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │    Agent Handler (runAgent)                      │   │
│  │    ├─ Input Validation                           │   │
│  │    ├─ Intent Classification                      │   │
│  │    └─ Response Generation                        │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     │                                     │
│  ┌──────────────────▼───────────────────────────────┐   │
│  │    Intent Handlers                               │   │
│  │    ├─ Code Review Handler                        │   │
│  │    ├─ Explanation Handler                        │   │
│  │    ├─ Refactoring Handler                        │   │
│  │    └─ Snippet Handler                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
backend-stage3/
├── src/
│   ├── server.ts              # Express server & A2A endpoint
│   ├── types.ts               # TypeScript type definitions
│   ├── agent/
│   │   ├── index.ts           # Agent entry point (runAgent)
│   │   └── handler.ts         # Intent classification & handlers
│   └── .env                   # Environment variables (git-ignored)
├── dist/                      # Compiled JavaScript
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment template
├── README.md                  # This file
└── workflow.json              # Mastra workflow configuration
```

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-stage3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run locally (development)**
   ```bash
   npm run dev
   ```

6. **Run production build**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Mastra Configuration
MASTRA_API_KEY=your_mastra_api_key_here

# OpenAI API Key (for LLM capabilities)
OPENAI_API_KEY=your_openai_api_key_here

# Telex Configuration
TELEX_API_URL=https://api.telex.im
TELEX_WEBHOOK_SECRET=your_webhook_secret_here
```

## API Endpoints

### A2A Agent Endpoint

**POST** `/a2a/agent/telex-codebuddy`

Handles incoming agent messages from Telex.im via the A2A protocol.

**Request Payload:**
```json
{
  "id": "message-uuid",
  "channel_id": "channel-uuid",
  "user": {
    "id": "user-uuid",
    "name": "User Name"
  },
  "text": "review: function add(a, b) { return a + b; }",
  "metadata": {
    "timestamp": "2024-11-04T12:00:00Z"
  }
}
```

**Response:**
```json
{
  "reply": {
    "text": "Code review summary:\n- Issues found: 0\n\nTop suggestions:\n1. No obvious issues found. Consider adding tests and types.",
    "attachments": [
      {
        "type": "code",
        "data": {
          "language": "javascript",
          "content": "function add(a, b) { return a + b; }"
        }
      }
    ]
  },
  "actions": [
    {
      "type": "button",
      "label": "Request Full Review (long)",
      "payload": { "mode": "long" }
    }
  ]
}
```

### Webhook Endpoint

**POST** `/webhook/telex`

Optional webhook for receiving Telex events (signature validation would be added in production).

### Health Check

**GET** `/`

Returns: `"TelexCodeBuddy is alive"`

## Intent Classification

The agent uses the following intent patterns:

| Intent | Triggers | Handler |
|--------|----------|---------|
| `code_review` | `review`, `code review` | Analyzes code for issues |
| `explain` | `explain`, `explain ` | Provides explanations |
| `refactor` | `refactor` | Suggests improvements |
| `snippet` | `snippet` | Generates code examples |
| `small_talk` | (default) | General responses |

### Usage Examples

```
User: "review: const x = 5 == 5; var name = 'John';"
Agent: [Code review with issues found]

User: "explain: what is a closure in JavaScript?"
Agent: [Detailed explanation of closures]

User: "refactor: function f(x) { if (x > 5) { return true; } else { return false; } }"
Agent: [Refactoring suggestions]

User: "snippet: node hello world"
Agent: [Code snippet example]
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

Compiled files are output to the `dist/` directory.

### Development Server

```bash
npm run dev
```

Runs the server with hot-reload using ts-node/esm loader.

## Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `backend-stage3`

3. **Configure Environment Variables**
   - Add all `.env` variables in Vercel project settings

4. **Deploy**
   - Vercel automatically deploys on push

**Example Deployment URL:** `https://telex-codebuddy.vercel.app`

### Option 2: Railway

1. **Initialize Railway**
   ```bash
   npm install -g @railway/cli
   railway init
   ```

2. **Connect to GitHub**
   - Follow Railway's GitHub connection flow

3. **Add Environment Variables**
   - In Railway dashboard, add all `.env` variables

4. **Deploy**
   ```bash
   railway up
   ```

### Option 3: Render

1. **Create a `render.yaml`** in the root:
   ```yaml
   services:
     - type: web
       name: telex-codebuddy
       runtime: node
       buildCommand: cd backend-stage3 && npm install && npm run build
       startCommand: cd backend-stage3 && npm start
       envVars:
         - key: PORT
           value: 4000
   ```

2. **Push to GitHub and connect Render**
3. **Add environment variables in Render dashboard**

### Update Workflow Configuration

After deployment, update `workflow.json` with your deployment URL:

```json
{
  "nodes": [
    {
      "type": "a2a/mastra-a2a-node",
      "url": "https://your-deployed-url/a2a/agent/telex-codebuddy"
    }
  ]
}
```

## Integration with Telex.im

### 1. Register Agent

Contact Telex.im to register your agent:
```
/telex-invite your-email@example.com
```

### 2. Add Workflow

Import `workflow.json` into Telex.im with your agent's URL.

### 3. Test Integration

Send a message to your agent on Telex.im. Check logs at:
```
https://api.telex.im/agent-logs/{channel-id}.txt
```

### 4. Monitor

View agent activity in Telex.im dashboard.

## Testing

### Local Testing with cURL

```bash
# Test code review
curl -X POST http://localhost:4000/a2a/agent/telex-codebuddy \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "channel_id": "test-channel",
    "user": {"id": "user-1", "name": "Test User"},
    "text": "review: const x = 5 == 5;",
    "metadata": {}
  }'

# Test explanation
curl -X POST http://localhost:4000/a2a/agent/telex-codebuddy \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-2",
    "channel_id": "test-channel",
    "user": {"id": "user-1", "name": "Test User"},
    "text": "explain: arrow functions",
    "metadata": {}
  }'

# Test snippet
curl -X POST http://localhost:4000/a2a/agent/telex-codebuddy \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-3",
    "channel_id": "test-channel",
    "user": {"id": "user-1", "name": "Test User"},
    "text": "snippet: express server",
    "metadata": {}
  }'
```

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Agent Framework**: Mastra
- **LLM**: OpenAI GPT-4
- **Validation**: Zod
- **HTTP Client**: Axios
- **Environment**: dotenv

## Error Handling

The agent includes comprehensive error handling:

- Input validation for empty messages
- Try-catch blocks in all async operations
- Proper HTTP status codes (400, 500)
- Detailed error logging
- Graceful fallbacks

## Future Enhancements

- [ ] LLM-powered code analysis with OpenAI
- [ ] Support for multiple programming languages
- [ ] Code execution in sandboxed environment
- [ ] Performance metrics and analytics
- [ ] Caching for repeated queries
- [ ] Rate limiting and quota management
- [ ] Advanced refactoring with AST analysis
- [ ] Integration with GitHub for PR reviews
- [ ] Multi-language support

## Troubleshooting

### Server Won't Start
```bash
# Check if port 4000 is in use
lsof -i :4000

# Kill process on port 4000
kill -9 <PID>
```

### TypeScript Compilation Errors
```bash
# Clear and rebuild
rm -rf dist
npm run build
```

### Environment Variables Not Loading
```bash
# Ensure .env file exists
ls -la .env

# Check NODE_ENV
echo $NODE_ENV
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Create a GitHub issue
- Contact: [support email]
- Telex.im Support: https://telex.im/support

## Changelog

### v0.1.0 (Initial Release)
- Basic code review functionality
- Intent classification
- Explanation handler
- Snippet generator
- Telex.im A2A integration
- Deployment guides

---

**Built with ❤️ for HNG13 Internship | Stage 3**

**Agent Live URL**: [Your deployment URL]
**Repository**: [Your repo URL]
**Blog Post**: [Your blog post URL]
