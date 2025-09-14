import { ReservationInput, ReservationInputUpdate } from "../interfaces";
import { ReservationDocument, ReservationModel } from "../models";
import { UserModel, RestaurantModel } from "../models";


class ReservationService {
    public async create(reservationInput: ReservationInput): Promise<ReservationDocument> {
        // Verificar que el usuario que crea la serva existe
        const userExists = await UserModel.findById(reservationInput.userId);
        if (!userExists) {
            throw new ReferenceError("User not found");
        }

        const restaurantExists = await RestaurantModel.findById(reservationInput.restaurantId);
        if (!restaurantExists) {
            throw new ReferenceError("Restaurant not found");
        }
        

        return ReservationModel.create(reservationInput);
    }

    public async update(id: string, reservationInput: ReservationInputUpdate): Promise<ReservationDocument | null> {
        try {
            const reservation: ReservationDocument | null = await ReservationModel.findOneAndUpdate(
                { _id: id },
                reservationInput,
                { returnOriginal: false }
            );

            return reservation;
        } catch (error) {
            throw error;
        }
    }

    public getAll(): Promise<ReservationDocument[]> {
        return ReservationModel.find({deletedAt: null}).populate('restaurantId', 'name address').populate('userId', 'name');
    }

    public getById(id: string): Promise<ReservationDocument | null> {
        return ReservationModel.findById(id).populate('restaurantId', 'name address').populate('userId', 'name');
    }

    public async delete(id: string): Promise<boolean> {
        try {
            const result = await ReservationModel.findByIdAndUpdate(id, { deletedAt: new Date() });
            return result !== null;
        } catch (error) {
            throw error;
        }
    }

    public getByUserId(userId: string): Promise<ReservationDocument[]> {
        return ReservationModel.find({ userId: userId }).populate('userId', 'name');
    }

    public getByRestaurantId(restaurantId: string): Promise<ReservationDocument[]> {
        return ReservationModel.find({  restaurantId: restaurantId }).populate('restaurantId', 'name address');
    }
}

export const reservationService = new ReservationService();
