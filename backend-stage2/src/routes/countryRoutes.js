import express from "express";
import {
  refreshCountries,
  getCountries,
  getCountryByName,
  deleteCountry,
  getStatus,
  getSummaryImage,
} from "../controllers/countryController.js";

const router = express.Router();

router.post("/countries/refresh", refreshCountries);
router.get("/countries/image", getSummaryImage);
router.get("/countries", getCountries);
router.get("/countries/:name", getCountryByName);
router.delete("/countries/:name", deleteCountry);
router.get("/status", getStatus);

export default router;
