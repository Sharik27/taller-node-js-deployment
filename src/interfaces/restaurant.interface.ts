
export interface RestaurantInput{
    name: string,  
    address: string,
    city: string,
    nit: string,
    phone: string
}

export interface RestaurantInputUpdate{
    name?: string,
    address?: string,
    city?: string,
    phone?: string
}
