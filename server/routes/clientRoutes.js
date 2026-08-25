import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clientController.js";

const router = express.Router();

// All client routes require authentication
router.use(protect);

router.route("/")
  .get(getClients)
  .post(createClient);

router.route("/:id")
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

export default router;
