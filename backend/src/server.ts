import express from "express";
import reviewsRoutes from "../routes/reviewsRoutes";
import profileRoutes from "../routes/profileRoutes";
import matchingRoutes from "../routes/MatchingRoutes";
import userRoutes from "../routes/userRoutes";
import messageRoutes from "../routes/messageRoutes";
import "../models/matchingPageModel";
import "../models/chatUser";
import "../models/chatMessage";
import path from "path";
import cors from "cors";

import { sequelize } from "../models/db";

const app = express();

// serve that folder publicly
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Allow port 3000 (backend) and 5173 (frontend) to share resources for compatibility
// Cors is a middleware and it stands for Cross‑Origin Resource Sharing
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/profile", profileRoutes);
app.use("/matching", matchingRoutes);
app.use("/reviews", reviewsRoutes);

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 3000;
const startServer = async (): Promise<void> => {
  console.log("Connecting to SQL database and synchronizing models...");
  // Test connection
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");

  console.log("Synchronizing SQL database...");
  await sequelize.sync({ alter: true });
  console.log("SQL database synchronized.");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Accepting requests from origin: ${"http://localhost:5173"}`);
  });
};

startServer();
