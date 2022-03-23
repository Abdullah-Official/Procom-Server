import express from "express";
import {
  signin,
  signup,
  getAllUsers,
  getUserById,
  getUsersCount,
  deleteUser,
  updateUser,
  forgotPassword,
  newPassword
} from "../controllers/user.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

// Read Operations
router.get("/", getAllUsers);
router.get("/:id", authMiddleware, getUserById);
router.get("/get/count", authMiddleware, getUsersCount);

// Write Operations
router.post("/signin", signin);
router.post("/signup", signup);
router.delete("/delete/:id", authMiddleware, deleteUser);
router.put("/update/:id", authMiddleware, updateUser);
router.post("/forgot-password", forgotPassword);
router.post("/new-password", newPassword);

export default router;
