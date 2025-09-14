import { Request, Response } from "express";
import { ReservationDocument } from "../models";
import { reservationService } from "../services";
import { ReservationInput, ReservationInputUpdate } from "../interfaces";

class ReservationController{
    public async create(req: Request, res:Response){
        try {
            const newReservation: ReservationDocument = await reservationService.create(req.body as ReservationInput);
            res.status(201).json(newReservation);
        } catch (error) {
            if (error instanceof ReferenceError){
                res.status(400).json({message: "Restaurant or User not found"});
            }
            res.status(500).json(error);
            
        }
    }

     public async getAll(req: Request, res: Response) {
        try {
            const reservation: ReservationDocument[] = await reservationService.getAll();
            res.json(reservation);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const reservation: ReservationDocument | null = await reservationService.getById(id);
            if (reservation === null) {
                res.status(404).json({ message: `Reservation with id ${id} not found` });
                return;
            }
            res.json(reservation);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const reservation: ReservationDocument | null = await reservationService.update(id, req.body as ReservationInputUpdate);
            if (reservation === null) {
                res.status(404).json({ message: `Reservation with id ${id} not found` });
                return;
            }
            res.json(reservation);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const deleted: boolean = await reservationService.delete(id);
            if (!deleted) {
                res.status(404).json({ message: `Reservation with id ${id} not found` });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getByUserId(req: Request, res: Response) {
        try {
            const userId: string = req.params.userId || "";
            const reservations: ReservationDocument[] = await reservationService.getByUserId(userId);
            res.json(reservations);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getByRestaurantId(req: Request, res: Response) {
        try {
            const restaurantId: string = req.params.restaurantId || "";
            const reservations: ReservationDocument[] = await reservationService.getByRestaurantId(restaurantId);
            res.json(reservations);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    
}

export const reservationController = new ReservationController();