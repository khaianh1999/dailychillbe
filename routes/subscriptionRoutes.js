const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");

router.get("/", subscriptionController.getAll);
router.get("/:id", subscriptionController.getById);
router.post("/", subscriptionController.create);

module.exports = router;
