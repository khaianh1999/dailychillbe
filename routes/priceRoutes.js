const express = require("express");
const router = express.Router();
const priceController = require("../controllers/priceController");

router.get("/", priceController.getAll);
router.post("/", priceController.create);

module.exports = router;
