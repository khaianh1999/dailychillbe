const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
// ➡️ Thêm route mới để trả tổng hợp:
router.get("/summary", assetController.getSummary);

router.get("/", assetController.getAll);
router.get("/:id", assetController.getById);
router.post("/", assetController.create);
router.put("/:id", assetController.update);
router.delete("/:id", assetController.remove);


module.exports = router;
