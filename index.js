// index.js or app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { setupSocket, runScheduledTasks } = require("./utils/chatSocket");
const errorHandler = require("./Middlewares/errorHandler");
const router = require("./Routes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json()); // Add JSON parsing for API routes

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Initialize Socket.IO
setupSocket(server);

// Routes
app.use("/api/v1", router);

// Error Handler Middleware
app.use(errorHandler);

// Start Server
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});