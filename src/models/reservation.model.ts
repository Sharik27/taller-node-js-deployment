import mongoose from "mongoose";
import { ReservationInput } from "../interfaces"; // TODO

export interface ReservationDocument extends ReservationInput, mongoose.Document {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null
}

const reservationSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    hour:{type: String, required: true},
    restaurantId:{type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true},
    userId:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    userQuantity:{type: Number, required: true},
    status:{type: String, required: true},
    deletedAt:{type: Date, default: null}
}, { timestamps: true, collection: 'reservations' })

export const ReservationModel = mongoose.model<ReservationDocument>("Reservation", reservationSchema); 