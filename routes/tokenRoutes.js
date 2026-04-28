const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.get("/check", tokenController.checkToken);
router.get("/check-phone", tokenController.checkSubscriptionByPhone);
router.get("/", tokenController.getAll);
router.post("/", tokenController.create);

module.exports = router;
