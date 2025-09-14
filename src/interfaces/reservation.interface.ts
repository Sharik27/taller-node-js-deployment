export interface ReservationInput{
    date: Date,
    hour: string,
    restaurantId: string,
    userId: string,
    userQuantity: Number,
    status: string

}

export interface ReservationInputUpdate{
    date?: Date,
    hour?: string,
    userQuantity?: Number,
    status?: string
}