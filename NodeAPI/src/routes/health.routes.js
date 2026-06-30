const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: process.env.SERVICE_NAME || "task12-nodeapi-microservice",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
