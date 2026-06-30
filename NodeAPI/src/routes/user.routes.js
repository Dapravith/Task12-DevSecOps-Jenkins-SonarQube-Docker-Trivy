const express = require("express");

const router = express.Router();

const users = [
  {
    id: 1,
    name: "Admin User",
    role: "admin",
  },
  {
    id: 2,
    name: "Developer User",
    role: "developer",
  },
  {
    id: 3,
    name: "Tester User",
    role: "tester",
  },
];

router.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    total: users.length,
    data: users,
  });
});

router.get("/:id", (req, res) => {
  const userId = Number(req.params.id);
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  return res.status(200).json({
    status: "success",
    data: user,
  });
});

module.exports = router;
