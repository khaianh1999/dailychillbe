// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/", notificationController.getAll);
router.get("/:id", notificationController.getById);
router.post("/", notificationController.create);
router.put("/:id", notificationController.update);
router.delete("/:id", notificationController.remove);

module.exports = router;
