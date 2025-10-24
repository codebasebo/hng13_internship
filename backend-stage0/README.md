
# 🧙‍♂️ Backend Wizards — Stage 0 Task: Dynamic Profile Endpoint

Welcome to my submission for Stage 0 of the Backend Wizards track! This project is a simple RESTful API built with **Node.js and Express** that returns my profile information along with a dynamic cat fact fetched from the [Cat Facts API](https://catfact.ninja/fact).

---

## 🚀 Live Endpoint

**GET** `/me`  
🔗 [http://your-deployed-url.com/me](http://your-deployed-url.com/me)

---

## 📦 Tech Stack

- Node.js
- Express.js
- Axios
- CORS
- dotenv

---

## 📂 Project Structure

```
stage-zero-backend/
├── server.js
├── .env
├── package.json
└── README.md
```

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stage-zero-backend.git
cd stage-zero-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

```env
PORT=3000
```

### 4. Run the Server Locally

```bash
node server.js
```

The server will start at:  
`http://localhost:3000/me`

---

## 🧪 How to Test

You can test the `/me` endpoint using:

### ✅ curl

```bash
curl http://localhost:3000/me
```

### ✅ Postman

- Method: GET
- URL: `http://localhost:3000/me`
- Response: JSON with profile info, timestamp, and a random cat fact

---

## 📄 Response Format

```json
{
  "status": "success",
  "user": {
    "email": "your@email.com",
    "name": "Your Full Name",
    "stack": "Node.js/Express"
  },
  "timestamp": "2025-10-20T01:30:54.326Z",
  "fact": "A cat's cerebral cortex contains about twice as many neurons as that of dogs..."
}
```

---

## ⚙️ Environment Variables

| Variable | Description         |
|----------|---------------------|
| `PORT`   | Port number to run the server |

---

## 🧠 What I Learned

This task taught me how to:
- Build a RESTful API with dynamic data
- Integrate third-party APIs using Axios
- Handle errors and timeouts gracefully
- Format JSON responses to match strict schemas
- Deploy backend services to cloud platforms

---

## 📸 Social Post

I’ve documented my process and learnings in this post:  
🔗 [LinkedIn / Dev.to / Medium / Hashnode / X Post](https://your-social-post-link.com)

---

## 📤 Submission Checklist

- ✅ Live `/me` endpoint
- ✅ GitHub repo with README
- ✅ Social post with screenshots and insights
- ✅ Submitted via `/stage-zero-backend` in Slack

---

## 🙌 Thank You

Thanks to the Backend Wizards team for this fun and insightful challenge!  
Let’s keep building magic 🪄

```

---

Let me know if you want help writing your social post next — I can help you make it engaging and professional!