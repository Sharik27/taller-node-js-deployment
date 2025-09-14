import express from "express";
import { restaurantController } from "../controllers";
import { restaurantValidations } from "../validators";
import { authMiddleware, checkRole } from "../middlewares";
import { UserRole } from "../models";

export const router = express.Router();

router.get("/", authMiddleware, restaurantController.getAll);
router.get("/:id", authMiddleware, restaurantValidations.id, restaurantController.getOne);
router.post("/", authMiddleware, checkRole(UserRole.ADMIN), restaurantValidations.create, restaurantController.create);
router.put("/:id", authMiddleware, checkRole(UserRole.ADMIN), restaurantValidations.id, restaurantValidations.update, restaurantController.update);
router.delete("/:id", authMiddleware, checkRole(UserRole.ADMIN), restaurantValidations.id, restaurantController.delete);
