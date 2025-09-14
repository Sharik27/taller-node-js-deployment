
import { reservationController } from "../../controllers/reservation.controller";
import { reservationService } from "../../services";
import { Request, Response } from "express";
import { ReservationDocument } from "../../models";
import { ReservationInput, ReservationInputUpdate } from "../../interfaces";


jest.mock("../../services", () => ({
    reservationService: {
        create: jest.fn(),
        getAll: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getByUserId: jest.fn(),
        getByRestaurantId: jest.fn(),
    },
}));

describe("ReservationController", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    
    
    
    describe("create", () => {
        it("should create a new reservation and return 201", async () => {
            
            const mockReservationInput: ReservationInput = {
                date: new Date("2024-12-25"),
                hour: "19:30",
                restaurantId: "restaurant123",
                userId: "user123",
                userQuantity: 4,
                status: "confirmed"
            };

            const mockCreatedReservation: ReservationDocument = {
                _id: "reservation123",
                date: mockReservationInput.date,
                hour: mockReservationInput.hour,
                restaurantId: mockReservationInput.restaurantId,
                userId: mockReservationInput.userId,
                userQuantity: mockReservationInput.userQuantity,
                status: mockReservationInput.status,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as ReservationDocument;

            req.body = mockReservationInput;
            (reservationService.create as jest.Mock).mockResolvedValue(mockCreatedReservation);

            
            await reservationController.create(req as Request, res as Response);

            
            expect(reservationService.create).toHaveBeenCalledWith(mockReservationInput);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedReservation);
        });

        it("should return 400 when restaurant or user not found (ReferenceError)", async () => {
            
            const mockReservationInput: ReservationInput = {
                date: new Date("2024-12-25"),
                hour: "19:30",
                restaurantId: "nonexistent123",
                userId: "user123",
                userQuantity: 2,
                status: "pending"
            };

            req.body = mockReservationInput;
            const error = new ReferenceError("Restaurant not found");
            (reservationService.create as jest.Mock).mockRejectedValue(error);

            
            await reservationController.create(req as Request, res as Response);

            
            expect(reservationService.create).toHaveBeenCalledWith(mockReservationInput);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant or User not found" });
        });

        it("should return 500 for generic errors", async () => {
            
            const mockReservationInput: ReservationInput = {
                date: new Date("2024-12-25"),
                hour: "19:30",
                restaurantId: "restaurant123",
                userId: "user123",
                userQuantity: 3,
                status: "confirmed"
            };

            req.body = mockReservationInput;
            const error = new Error("Database connection error");
            (reservationService.create as jest.Mock).mockRejectedValue(error);

            
            await reservationController.create(req as Request, res as Response);

            
            expect(reservationService.create).toHaveBeenCalledWith(mockReservationInput);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should handle empty request body", async () => {
            
            req.body = {};
            const mockCreatedReservation: ReservationDocument = {
                _id: "reservation123",
                date: new Date(),
                hour: "",
                restaurantId: "",
                userId: "",
                userQuantity: 0,
                status: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as ReservationDocument;

            (reservationService.create as jest.Mock).mockResolvedValue(mockCreatedReservation);

            
            await reservationController.create(req as Request, res as Response);

            
            expect(reservationService.create).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedReservation);
        });
    });

    
    
    
    describe("getAll", () => {
        it("should return all reservations", async () => {
            
            const mockReservations: ReservationDocument[] = [
                {
                    _id: "reservation1",
                    date: new Date("2024-12-25"),
                    hour: "19:30",
                    restaurantId: "restaurant123",
                    userId: "user123",
                    userQuantity: 4,
                    status: "confirmed",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
                {
                    _id: "reservation2",
                    date: new Date("2024-12-26"),
                    hour: "20:00",
                    restaurantId: "restaurant456",
                    userId: "user456",
                    userQuantity: 2,
                    status: "pending",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
            ];

            (reservationService.getAll as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getAll(req as Request, res as Response);

            
            expect(reservationService.getAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should return empty array when no reservations exist", async () => {
            
            const mockReservations: ReservationDocument[] = [];
            (reservationService.getAll as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getAll(req as Request, res as Response);

            
            expect(reservationService.getAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should return 500 if an error occurs", async () => {
            
            const error = new Error("Database error");
            (reservationService.getAll as jest.Mock).mockRejectedValue(error);

            
            await reservationController.getAll(req as Request, res as Response);

            
            expect(reservationService.getAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });
    });

    
    
    
    describe("getOne", () => {
        it("should return a reservation by id", async () => {
            
            const mockReservation: ReservationDocument = {
                _id: "reservation123",
                date: new Date("2024-12-25"),
                hour: "19:30",
                restaurantId: "restaurant123",
                userId: "user123",
                userQuantity: 4,
                status: "confirmed",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as ReservationDocument;

            req.params = { id: "reservation123" };
            (reservationService.getById as jest.Mock).mockResolvedValue(mockReservation);

            
            await reservationController.getOne(req as Request, res as Response);

            
            expect(reservationService.getById).toHaveBeenCalledWith("reservation123");
            expect(res.json).toHaveBeenCalledWith(mockReservation);
        });

        it("should return 404 if reservation is not found", async () => {
            
            req.params = { id: "nonexistent123" };
            (reservationService.getById as jest.Mock).mockResolvedValue(null);

            
            await reservationController.getOne(req as Request, res as Response);

            
            expect(reservationService.getById).toHaveBeenCalledWith("nonexistent123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id nonexistent123 not found" 
            });
        });

        it("should handle empty id parameter", async () => {
            
            req.params = {};
            (reservationService.getById as jest.Mock).mockResolvedValue(null);

            
            await reservationController.getOne(req as Request, res as Response);

            
            expect(reservationService.getById).toHaveBeenCalledWith("");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await reservationController.getOne(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { id: "reservation123" };
            const error = new Error("Database error");
            (reservationService.getById as jest.Mock).mockRejectedValue(error);

            
            await reservationController.getOne(req as Request, res as Response);

            
            expect(reservationService.getById).toHaveBeenCalledWith("reservation123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });
    });

    
    
    
    describe("update", () => {
        it("should update a reservation and return the updated reservation", async () => {
            
            const mockReservationUpdate: ReservationInputUpdate = {
                date: new Date("2024-12-26"),
                hour: "20:00",
                userQuantity: 6,
                status: "confirmed"
            };

            const mockUpdatedReservation: ReservationDocument = {
                _id: "reservation123",
                date: mockReservationUpdate.date!,
                hour: mockReservationUpdate.hour!,
                restaurantId: "restaurant123",
                userId: "user123",
                userQuantity: mockReservationUpdate.userQuantity!,
                status: mockReservationUpdate.status!,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as ReservationDocument;

            req.params = { id: "reservation123" };
            req.body = mockReservationUpdate;
            (reservationService.update as jest.Mock).mockResolvedValue(mockUpdatedReservation);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("reservation123", mockReservationUpdate);
            expect(res.json).toHaveBeenCalledWith(mockUpdatedReservation);
        });

        it("should return 404 if reservation is not found", async () => {
            
            const mockReservationUpdate: ReservationInputUpdate = {
                status: "cancelled",
            };

            req.params = { id: "nonexistent123" };
            req.body = mockReservationUpdate;
            (reservationService.update as jest.Mock).mockResolvedValue(null);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("nonexistent123", mockReservationUpdate);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id nonexistent123 not found" 
            });
        });

        it("should handle partial updates", async () => {
            
            const mockReservationUpdate: ReservationInputUpdate = {
                status: "cancelled",
            };

            const mockUpdatedReservation: ReservationDocument = {
                _id: "reservation123",
                date: new Date("2024-12-25"),
                hour: "19:30",
                restaurantId: "restaurant123",
                userId: "user123",
                userQuantity: 4,
                status: "cancelled",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as ReservationDocument;

            req.params = { id: "reservation123" };
            req.body = mockReservationUpdate;
            (reservationService.update as jest.Mock).mockResolvedValue(mockUpdatedReservation);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("reservation123", mockReservationUpdate);
            expect(res.json).toHaveBeenCalledWith(mockUpdatedReservation);
        });

        it("should handle empty id parameter", async () => {
            
            const mockReservationUpdate: ReservationInputUpdate = {
                status: "confirmed",
            };

            req.params = {};
            req.body = mockReservationUpdate;
            (reservationService.update as jest.Mock).mockResolvedValue(null);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("", mockReservationUpdate);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await reservationController.update(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            const mockReservationUpdate: ReservationInputUpdate = {
                status: "confirmed",
            };

            req.params = { id: "reservation123" };
            req.body = mockReservationUpdate;
            const error = new Error("Database error");
            (reservationService.update as jest.Mock).mockRejectedValue(error);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("reservation123", mockReservationUpdate);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should handle empty body", async () => {
            
            req.params = { id: "reservation123" };
            req.body = {};
            (reservationService.update as jest.Mock).mockResolvedValue(null);

            
            await reservationController.update(req as Request, res as Response);

            
            expect(reservationService.update).toHaveBeenCalledWith("reservation123", {});
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id reservation123 not found" 
            });
        });
    });

    
    
    
    describe("delete", () => {
        it("should delete a reservation and return 204", async () => {
            
            req.params = { id: "reservation123" };
            (reservationService.delete as jest.Mock).mockResolvedValue(true);

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(reservationService.delete).toHaveBeenCalledWith("reservation123");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should return 404 if reservation is not found", async () => {
            
            req.params = { id: "nonexistent123" };
            (reservationService.delete as jest.Mock).mockResolvedValue(false);

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(reservationService.delete).toHaveBeenCalledWith("nonexistent123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id nonexistent123 not found" 
            });
        });

        it("should handle empty id parameter", async () => {
            
            req.params = {};
            (reservationService.delete as jest.Mock).mockResolvedValue(false);

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(reservationService.delete).toHaveBeenCalledWith("");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Reservation with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { id: "reservation123" };
            const error = new Error("Database error");
            (reservationService.delete as jest.Mock).mockRejectedValue(error);

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(reservationService.delete).toHaveBeenCalledWith("reservation123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should not call res.json when deletion is successful", async () => {
            
            req.params = { id: "reservation123" };
            (reservationService.delete as jest.Mock).mockResolvedValue(true);

            
            await reservationController.delete(req as Request, res as Response);

            
            expect(reservationService.delete).toHaveBeenCalledWith("reservation123");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    
    
    
    describe("getByUserId", () => {
        it("should return reservations by user id", async () => {
            
            const mockReservations: ReservationDocument[] = [
                {
                    _id: "reservation1",
                    date: new Date("2024-12-25"),
                    hour: "19:30",
                    restaurantId: "restaurant123",
                    userId: "user123",
                    userQuantity: 4,
                    status: "confirmed",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
                {
                    _id: "reservation2",
                    date: new Date("2024-12-26"),
                    hour: "20:00",
                    restaurantId: "restaurant456",
                    userId: "user123",
                    userQuantity: 2,
                    status: "pending",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
            ];

            req.params = { userId: "user123" };
            (reservationService.getByUserId as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getByUserId(req as Request, res as Response);

            
            expect(reservationService.getByUserId).toHaveBeenCalledWith("user123");
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should return empty array when user has no reservations", async () => {
            
            const mockReservations: ReservationDocument[] = [];
            req.params = { userId: "user123" };
            (reservationService.getByUserId as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getByUserId(req as Request, res as Response);

            
            expect(reservationService.getByUserId).toHaveBeenCalledWith("user123");
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should handle empty userId parameter", async () => {
            
            req.params = {};
            (reservationService.getByUserId as jest.Mock).mockResolvedValue([]);

            
            await reservationController.getByUserId(req as Request, res as Response);

            
            expect(reservationService.getByUserId).toHaveBeenCalledWith("");
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await reservationController.getByUserId(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { userId: "user123" };
            const error = new Error("Database error");
            (reservationService.getByUserId as jest.Mock).mockRejectedValue(error);

            
            await reservationController.getByUserId(req as Request, res as Response);

            
            expect(reservationService.getByUserId).toHaveBeenCalledWith("user123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });
    });

    
    
    
    describe("getByRestaurantId", () => {
        it("should return reservations by restaurant id", async () => {
            
            const mockReservations: ReservationDocument[] = [
                {
                    _id: "reservation1",
                    date: new Date("2024-12-25"),
                    hour: "19:30",
                    restaurantId: "restaurant123",
                    userId: "user123",
                    userQuantity: 4,
                    status: "confirmed",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
                {
                    _id: "reservation2",
                    date: new Date("2024-12-26"),
                    hour: "20:00",
                    restaurantId: "restaurant123",
                    userId: "user456",
                    userQuantity: 2,
                    status: "pending",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as ReservationDocument,
            ];

            req.params = { restaurantId: "restaurant123" };
            (reservationService.getByRestaurantId as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(reservationService.getByRestaurantId).toHaveBeenCalledWith("restaurant123");
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should return empty array when restaurant has no reservations", async () => {
            
            const mockReservations: ReservationDocument[] = [];
            req.params = { restaurantId: "restaurant123" };
            (reservationService.getByRestaurantId as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(reservationService.getByRestaurantId).toHaveBeenCalledWith("restaurant123");
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });

        it("should handle empty restaurantId parameter", async () => {
            
            req.params = {};
            (reservationService.getByRestaurantId as jest.Mock).mockResolvedValue([]);

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(reservationService.getByRestaurantId).toHaveBeenCalledWith("");
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { restaurantId: "restaurant123" };
            const error = new Error("Database error");
            (reservationService.getByRestaurantId as jest.Mock).mockRejectedValue(error);

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(reservationService.getByRestaurantId).toHaveBeenCalledWith("restaurant123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should handle restaurantId with special characters", async () => {
            
            const mockReservations: ReservationDocument[] = [];
            req.params = { restaurantId: "restaurant-special_123" };
            (reservationService.getByRestaurantId as jest.Mock).mockResolvedValue(mockReservations);

            
            await reservationController.getByRestaurantId(req as Request, res as Response);

            
            expect(reservationService.getByRestaurantId).toHaveBeenCalledWith("restaurant-special_123");
            expect(res.json).toHaveBeenCalledWith(mockReservations);
        });
    });
});