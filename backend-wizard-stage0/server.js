import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

// CONFIG
const PORT = process.env.PORT || 3000;
const CAT_API = "https://catfact.ninja/fact";

// Endpoint: /me
app.get("/me", async (req, res) => {
  let catFact = "Could not fetch cat fact at this time.";

  try {
    const response = await axios.get(CAT_API, { timeout: 5000 });
    if (response.data && response.data.fact) {
      catFact = response.data.fact;
    }
  } catch (error) {
    console.error("Error fetching cat fact:", error.message);
  }

  const timestamp = new Date().toISOString();

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    status: "success",
    user: {
      email: "ucheroyal20212gmail.com", 
      name: "Uche Royal",          
      stack: "Node.js/Express",
    },
    timestamp,
    fact: catFact,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}/me`);
});
