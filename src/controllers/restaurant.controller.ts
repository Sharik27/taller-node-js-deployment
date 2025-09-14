import { Request, Response } from "express";
import { RestaurantDocument } from "../models";
import { restaurantService } from "../services";
import { RestaurantInput, RestaurantInputUpdate } from "../interfaces";

class RestaurantController{
    public async create(req: Request, res:Response){
        try {
            const newRestaurant: RestaurantDocument = await restaurantService.create(req.body as RestaurantInput);
            res.status(201).json(newRestaurant);
        } catch (error) {
            if (error instanceof ReferenceError){
                res.status(400).json({message: "Restaurant already exist"});
            }
            res.status(500).json(error);
            
        }
    }

     public async getAll(req: Request, res: Response) {
        try {
            const restaurant: RestaurantDocument[] = await restaurantService.getAll();
            res.json(restaurant);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async getOne(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const restaurant: RestaurantDocument | null = await restaurantService.getById(id);
            if (restaurant === null) {
                res.status(404).json({ message: `Restaurant with id ${id} not found` });
                return;
            }
            res.json(restaurant);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async update(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const restaurant: RestaurantDocument | null = await restaurantService.update(id, req.body as RestaurantInputUpdate);
            if (restaurant === null) {
                res.status(404).json({ message: `Restaurant with id ${id} not found` });
                return;
            }
            res.json(restaurant);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    public async delete(req: Request, res: Response) {
        try {
            const id: string = req.params.id || "";
            const deleted: boolean = await restaurantService.delete(id);
            if (!deleted) {
                res.status(404).json({ message: `Restaurant with id ${id} not found` });
                return;
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json(error);
        }
    }

    
}

export const restaurantController = new RestaurantController();