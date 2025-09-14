import express from "express";
import { reservationController } from "../controllers";
import { reservationValidations } from "../validators";
import { authMiddleware, checkRole } from "../middlewares";
import { UserRole } from "../models";

export const router = express.Router();

router.get("/user/:userId", authMiddleware, checkRole(UserRole.USER), reservationValidations.userId, reservationController.getByUserId );
router.get("/restaurant/:restaurantId", authMiddleware, checkRole(UserRole.ADMIN), reservationValidations.restaurantId, reservationController.getByRestaurantId );


router.get("/", authMiddleware, checkRole(UserRole.ADMIN), reservationController.getAll);
router.get("/:id", authMiddleware, reservationValidations.id, reservationController.getOne);
router.post("/", authMiddleware, checkRole(UserRole.USER), reservationValidations.create, reservationController.create);
router.put("/:id", authMiddleware, checkRole(UserRole.USER), reservationValidations.id, reservationValidations.update, reservationController.update);
router.delete("/:id", authMiddleware, checkRole(UserRole.USER), reservationValidations.id, reservationController.delete);
