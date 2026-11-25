import express from "express";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { handleCardGenerate, handleEmpathyCheck } from "./lib/aiHandlers.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(
    process.env.NGINX_PORT || process.env.DEFAULT_APP_PORT
      ? process.env.DEFAULT_APP_PORT || 3000
      : process.env.PORT || 3000
  );

  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Check Empathy (Step 4)
  app.post("/api/empathy/check", async (req, res) => {
    try {
      const result = await handleEmpathyCheck(req.body || {});
      res.json(result);
    } catch (error) {
      console.error("Error in /api/empathy/check:", error);
      res.status(500).json({ error: "Failed to evaluate empathy response" });
    }
  });

  // API Route: Generate Thank You Card Background (Step 5)
  app.post("/api/card/generate", async (req, res) => {
    try {
      const result = await handleCardGenerate(req.body || {});
      res.json(result);
    } catch (error) {
      console.error("Error in /api/card/generate:", error);
      res.status(500).json({ error: "Failed to generate card background" });
    }
  });

  const distPath = path.resolve(process.cwd(), "dist");
  const publicImagesPath = path.resolve(process.cwd(), "public/images");
  const distImagesPath = path.join(distPath, "images");

  // Ensure images are served from public or dist in both dev and production
  if (fs.existsSync(publicImagesPath)) {
    app.use("/images", express.static(publicImagesPath));
  }
  if (fs.existsSync(distImagesPath)) {
    app.use("/images", express.static(distImagesPath));
  }

  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isDev =
    process.env.NODE_ENV === "development" ||
    (process.env.NODE_ENV !== "production" && !hasDist);

  // Vite middleware for development; static dist serving for production
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server running on http://0.0.0.0:${PORT} (mode: ${isDev ? "development" : "production"})`
    );
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
