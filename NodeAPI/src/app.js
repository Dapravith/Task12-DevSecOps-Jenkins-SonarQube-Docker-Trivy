require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const errorHandler = require("./middlewares/error-handler");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: process.env.SERVICE_NAME || "task12-nodeapi-microservice",
    message: "Welcome to the Task 12 NodeAPI Microservice",
    status: "success",
    endpoints: {
      health: "/health",
      users: "/api/users",
      products: "/api/products",
    },
  });
});

app.use("/health", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorHandler);

module.exports = app;
