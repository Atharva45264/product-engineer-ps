import "dotenv/config";

import express from "express";
import cors from "cors";
import { createServer } from "node:http";

import { connectToDatabase } from "./db/mongodb";
import { createIndexes } from "./db/indexes";
import updatesRouter from "./routes/updates";
import { setupWebSocketServer } from "./websocket/websocket";

const app = express();

const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "realtime-feed-server",
  });
});

app.use("/api", updatesRouter);

const httpServer = createServer(app);

setupWebSocketServer(httpServer);

async function startServer() {
  try {
    await connectToDatabase();
    await createIndexes();

    httpServer.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
      console.log(
        `WebSocket running on ws://localhost:${PORT}/ws`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();