import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

const router = express.Router();

// All item routes require authentication
router.use(protect);

router.route("/")
  .get(getItems)
  .post(createItem);

router.route("/:id")
  .get(getItemById)
  .put(updateItem)
  .delete(deleteItem);

export default router;
