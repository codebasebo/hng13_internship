import fs from "fs";
import { createCanvas } from "canvas";

export function generateSummaryImage(countries, lastRefreshedAt) {
  try {
    const total = countries.length;
    const top5 = [...countries]
      .filter(c => c.estimated_gdp && !isNaN(c.estimated_gdp))
      .sort((a, b) => b.estimated_gdp - a.estimated_gdp)
      .slice(0, 5);

    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#fefefe";
    ctx.fillRect(0, 0, 800, 400);

    ctx.fillStyle = "#111";
    ctx.font = "20px Arial";
    ctx.fillText(`🌍 Country Currency Summary`, 50, 40);
    ctx.fillText(`Total Countries: ${total}`, 50, 80);
    ctx.fillText(`Last Refreshed: ${lastRefreshedAt}`, 50, 120);

    ctx.fillText(`Top 5 by Estimated GDP:`, 50, 170);
    top5.forEach((c, i) => {
      ctx.fillText(
        `${i + 1}. ${c.name} — ${c.currency_code} — ${c.estimated_gdp.toFixed(2)}`,
        50,
        210 + i * 30
      );
    });

    fs.mkdirSync("cache", { recursive: true });
    fs.writeFileSync("cache/summary.png", canvas.toBuffer("image/png"));
    console.log("✅ Summary image generated successfully");
  } catch (error) {
    console.error("❌ Error generating summary image:", error.message);
    // Don't throw - allow the app to continue without image generation
  }
}
