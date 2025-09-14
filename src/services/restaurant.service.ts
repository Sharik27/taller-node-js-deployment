import { RestaurantInput, RestaurantInputUpdate } from "../interfaces";
import {RestaurantDocument, RestaurantModel} from "../models";

class RestaurantService{

    public async create(restaurantInput: RestaurantInput): Promise<RestaurantDocument>{
        const restaurantExists = await RestaurantModel.exists({ nit: restaurantInput.nit });

        if(restaurantExists){
            throw new ReferenceError("Restaurant already exist");
        }

        return RestaurantModel.create(restaurantInput);
    }

    public async update(id: string, restaurantInput: RestaurantInputUpdate): Promise<RestaurantDocument | null>{
        try{
            const restaurant: RestaurantDocument | null = await RestaurantModel.findOneAndUpdate(
                {_id: id},
                restaurantInput,
                {returnOriginal: false}
            );

            return restaurant;
        }catch (error){
            throw error;
        }
    }

    public getAll(): Promise<RestaurantDocument[]>{
        return RestaurantModel.find({deletedAt: null})
    }

    public getById(id:String): Promise<RestaurantDocument | null>{
        return RestaurantModel.findById(id);
    } 

    public async delete(id: string): Promise<boolean>{
        try {
            const result = await RestaurantModel.findByIdAndUpdate(id, { deletedAt: new Date() });
            return result !== null;
        } catch(error){
            throw error;
        }
    }

}

export const restaurantService = new RestaurantService();