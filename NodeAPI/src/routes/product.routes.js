const express = require("express");

const router = express.Router();

const products = [
  {
    id: 1,
    name: "DevSecOps Starter API",
    price: 0,
    status: "active",
  },
  {
    id: 2,
    name: "Docker Deployment Service",
    price: 10,
    status: "active",
  },
   {
    id: 3,
    name: "Failed over service",
    price: 10,
    status: "inactive",
  },
];

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    total: products.length,
    data: products,
  });
});

router.get("/:id", (req, res) => {
  const productId = Number(req.params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({
      status: "error",
      message: "Product not found",
    });
  }

  return res.status(200).json({
    status: "success",
    data: product,
  });
});

module.exports = router;
