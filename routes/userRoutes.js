const express = require("express");
const userController = require("../controllers/userController");
const router = express.Router();


const verifyToken = require("../middleware/verifyToken");
router.get("/profile", verifyToken, userController.getUserInfor);
router.post("/addCode", verifyToken, userController.addCode);
router.post("/buynow", verifyToken, userController.buyNow);
router.get("/list_my_order", verifyToken, userController.listMyOrder);

router.get("/get_user", userController.getUserInforAndToken);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
