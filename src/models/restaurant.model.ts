import mongoose from "mongoose";
import { RestaurantInput } from "../interfaces"; // TODO

export interface RestaurantDocument extends RestaurantInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null
}

const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address:{type: String, required: true},
    city:{type: String, required: true},
    nit:{type: String, required: true, unique: true},
    phone:{type: String, required: true},
    deletedAt:{type: Date, default: null}
}, { timestamps: true, collection: 'restaurants' })

export const RestaurantModel = mongoose.model<RestaurantDocument>("Restaurant", restaurantSchema); 