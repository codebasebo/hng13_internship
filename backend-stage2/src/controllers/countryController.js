import axios from "axios";
import db from "../db/database.js";
import { generateSummaryImage } from "../utils/imageGenerator.js";
import fs from "fs";

// 🔄 POST /countries/refresh
export const refreshCountries = async (req, res) => {
  try {
    const countriesURL =
      "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies";
    const exchangeURL = "https://open.er-api.com/v6/latest/USD";

    let countriesRes, exchangeRes;
    
    try {
      countriesRes = await axios.get(countriesURL, { timeout: 10000 });
    } catch (error) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from RestCountries API"
      });
    }

    try {
      exchangeRes = await axios.get(exchangeURL, { timeout: 10000 });
    } catch (error) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from Exchange Rate API"
      });
    }

    const countries = countriesRes.data;
    const exchangeRates = exchangeRes.data.rates;

    const refreshedCountries = countries.map((c) => {
      const currency_code = c.currencies?.[0]?.code || null;
      const exchange_rate = currency_code ? exchangeRates[currency_code] || null : null;

      let estimated_gdp = 0;
      if (exchange_rate && c.population) {
        const randMultiplier = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
        estimated_gdp = (c.population * randMultiplier) / exchange_rate;
      }

      return {
        id: c.name.toLowerCase(),
        name: c.name,
        capital: c.capital || null,
        region: c.region || null,
        population: c.population,
        currency_code,
        exchange_rate,
        estimated_gdp,
        flag_url: c.flag || null,
        last_refreshed_at: new Date().toISOString(),
      };
    });

    await db.read();
    db.data.countries = refreshedCountries;
    db.data.metadata = db.data.metadata || {};
    db.data.metadata.last_refreshed_at = new Date().toISOString();
    await db.write();

    generateSummaryImage(refreshedCountries, db.data.metadata.last_refreshed_at);

    res.json({
      message: "Countries refreshed successfully",
      total: refreshedCountries.length,
      last_refreshed_at: db.data.metadata.last_refreshed_at,
    });
  } catch (error) {
    console.error("Refresh error:", error.message);
    res.status(503).json({
      error: "External data source unavailable",
      details: error.message,
    });
  }
};

// 🧾 GET /countries
export const getCountries = async (req, res) => {
  await db.read();
  const { region, currency, sort } = req.query;
  let result = db.data.countries || [];

  if (region) result = result.filter((c) => c.region?.toLowerCase() === region.toLowerCase());
  if (currency) result = result.filter((c) => c.currency_code === currency);

  if (sort === "gdp_desc") result.sort((a, b) => b.estimated_gdp - a.estimated_gdp);

  res.json(result);
};

// 🔍 GET /countries/:name
export const getCountryByName = async (req, res) => {
  await db.read();
  const name = req.params.name.toLowerCase();
  const country = (db.data.countries || []).find((c) => c.name.toLowerCase() === name);
  if (!country) return res.status(404).json({ error: "Country not found" });
  res.json(country);
};

// ❌ DELETE /countries/:name
export const deleteCountry = async (req, res) => {
  await db.read();
  const name = req.params.name.toLowerCase();
  const index = (db.data.countries || []).findIndex((c) => c.name.toLowerCase() === name);
  if (index === -1) return res.status(404).json({ error: "Country not found" });

  db.data.countries.splice(index, 1);
  await db.write();
  res.json({ message: "Country deleted successfully" });
};

// 📊 GET /status
export const getStatus = async (req, res) => {
  await db.read();
  res.json({
    total_countries: (db.data.countries || []).length,
    last_refreshed_at: db.data.metadata?.last_refreshed_at || null,
  });
};

// 🖼️ GET /countries/image
export const getSummaryImage = (req, res) => {
  if (!fs.existsSync("cache/summary.png")) {
    return res.status(404).json({ error: "Summary image not found" });
  }
  res.sendFile(process.cwd() + "/cache/summary.png");
};
