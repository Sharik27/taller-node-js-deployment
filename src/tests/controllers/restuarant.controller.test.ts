
import { restaurantController } from "../../controllers/restaurant.controller";
import { restaurantService } from "../../services/restaurant.service";
import { Request, Response } from "express";
import { RestaurantDocument } from "../../models";
import { RestaurantInput, RestaurantInputUpdate } from "../../interfaces";

jest.mock("../../services/restaurant.service", () => ({
    restaurantService: {
        create: jest.fn(),
        getAll: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

describe("RestaurantController", () => {
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
        it("should create a new restaurant and return 201", async () => {
            
            const mockRestaurantInput: RestaurantInput = {
                name: "Test Restaurant",
                address: "123 Test Street",
                city: "Test City",
                nit: "123456789",
                phone: "+1234567890"
            };

            const mockCreatedRestaurant: RestaurantDocument = {
                _id: "restaurant123",
                name: mockRestaurantInput.name,
                address: mockRestaurantInput.address,
                city: mockRestaurantInput.city,
                nit: mockRestaurantInput.nit,
                phone: mockRestaurantInput.phone,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as RestaurantDocument;

            req.body = mockRestaurantInput;
            (restaurantService.create as jest.Mock).mockResolvedValue(mockCreatedRestaurant);

            
            await restaurantController.create(req as Request, res as Response);

            
            expect(restaurantService.create).toHaveBeenCalledWith(mockRestaurantInput);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedRestaurant);
        });

        it("should return 400 when restaurant already exists (ReferenceError)", async () => {
            
            const mockRestaurantInput: RestaurantInput = {
                name: "Duplicate Restaurant",
                address: "456 Duplicate Street",
                city: "Duplicate City",
                nit: "987654321",
                phone: "+9876543210"
            };

            req.body = mockRestaurantInput;
            const error = new ReferenceError("Restaurant with this NIT already exists");
            (restaurantService.create as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.create(req as Request, res as Response);

            
            expect(restaurantService.create).toHaveBeenCalledWith(mockRestaurantInput);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Restaurant already exist" });
        });

        it("should return 500 for generic errors", async () => {
            
            const mockRestaurantInput: RestaurantInput = {
                name: "Error Restaurant",
                address: "789 Error Street",
                city: "Error City",
                nit: "111111111",
                phone: "+1111111111"
            };

            req.body = mockRestaurantInput;
            const error = new Error("Database connection error");
            (restaurantService.create as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.create(req as Request, res as Response);

            
            expect(restaurantService.create).toHaveBeenCalledWith(mockRestaurantInput);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should handle empty request body", async () => {
            
            req.body = {};
            const mockCreatedRestaurant: RestaurantDocument = {
                _id: "restaurant123",
                name: "",
                address: "",
                city: "",
                nit: "",
                phone: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as RestaurantDocument;

            (restaurantService.create as jest.Mock).mockResolvedValue(mockCreatedRestaurant);

            
            await restaurantController.create(req as Request, res as Response);

            
            expect(restaurantService.create).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreatedRestaurant);
        });
    });

    
    
    
    describe("getAll", () => {
        it("should return all restaurants", async () => {
            
            const mockRestaurants: RestaurantDocument[] = [
                {
                    _id: "restaurant1",
                    name: "Restaurant 1",
                    address: "Address 1",
                    city: "City 1",
                    nit: "111111111",
                    phone: "+1111111111",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as RestaurantDocument,
                {
                    _id: "restaurant2",
                    name: "Restaurant 2",
                    address: "Address 2",
                    city: "City 2",
                    nit: "222222222",
                    phone: "+2222222222",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                } as unknown as RestaurantDocument,
            ];

            (restaurantService.getAll as jest.Mock).mockResolvedValue(mockRestaurants);

            
            await restaurantController.getAll(req as Request, res as Response);

            
            expect(restaurantService.getAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockRestaurants);
        });

        it("should return empty array when no restaurants exist", async () => {
            
            const mockRestaurants: RestaurantDocument[] = [];
            (restaurantService.getAll as jest.Mock).mockResolvedValue(mockRestaurants);

            
            await restaurantController.getAll(req as Request, res as Response);

            
            expect(restaurantService.getAll).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockRestaurants);
        });

        it("should return 500 if an error occurs", async () => {
            
            const error = new Error("Database error");
            (restaurantService.getAll as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.getAll(req as Request, res as Response);

            
            expect(restaurantService.getAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });
    });

    
    
    
    describe("getOne", () => {
        it("should return a restaurant by id", async () => {
            
            const mockRestaurant: RestaurantDocument = {
                _id: "restaurant123",
                name: "Test Restaurant",
                address: "123 Test Street",
                city: "Test City",
                nit: "123456789",
                phone: "+1234567890",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as RestaurantDocument;

            req.params = { id: "restaurant123" };
            (restaurantService.getById as jest.Mock).mockResolvedValue(mockRestaurant);

            
            await restaurantController.getOne(req as Request, res as Response);

            
            expect(restaurantService.getById).toHaveBeenCalledWith("restaurant123");
            expect(res.json).toHaveBeenCalledWith(mockRestaurant);
        });

        it("should return 404 if restaurant is not found", async () => {
            
            req.params = { id: "nonexistent123" };
            (restaurantService.getById as jest.Mock).mockResolvedValue(null);

            
            await restaurantController.getOne(req as Request, res as Response);

            
            expect(restaurantService.getById).toHaveBeenCalledWith("nonexistent123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id nonexistent123 not found" 
            });
        });

        it("should handle empty id parameter", async () => {
            
            req.params = {};
            (restaurantService.getById as jest.Mock).mockResolvedValue(null);

            
            await restaurantController.getOne(req as Request, res as Response);

            
            expect(restaurantService.getById).toHaveBeenCalledWith("");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await restaurantController.getOne(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { id: "restaurant123" };
            const error = new Error("Database error");
            (restaurantService.getById as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.getOne(req as Request, res as Response);

            
            expect(restaurantService.getById).toHaveBeenCalledWith("restaurant123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });
    });

    
    
    
    describe("update", () => {
        it("should update a restaurant and return the updated restaurant", async () => {
            
            const mockRestaurantUpdate: RestaurantInputUpdate = {
                name: "Updated Restaurant Name",
                address: "Updated Address",
                city: "Updated City",
                phone: "+9999999999"
            };

            const mockUpdatedRestaurant: RestaurantDocument = {
                _id: "restaurant123",
                name: "Updated Restaurant Name",
                address: "Updated Address",
                city: "Updated City",
                nit: "123456789",
                phone: "+9999999999",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as RestaurantDocument;

            req.params = { id: "restaurant123" };
            req.body = mockRestaurantUpdate;
            (restaurantService.update as jest.Mock).mockResolvedValue(mockUpdatedRestaurant);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("restaurant123", mockRestaurantUpdate);
            expect(res.json).toHaveBeenCalledWith(mockUpdatedRestaurant);
        });

        it("should return 404 if restaurant is not found", async () => {
            
            const mockRestaurantUpdate: RestaurantInputUpdate = {
                name: "Updated Name",
            };

            req.params = { id: "nonexistent123" };
            req.body = mockRestaurantUpdate;
            (restaurantService.update as jest.Mock).mockResolvedValue(null);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("nonexistent123", mockRestaurantUpdate);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id nonexistent123 not found" 
            });
        });

        it("should handle partial updates", async () => {
            
            const mockRestaurantUpdate: RestaurantInputUpdate = {
                name: "Only Name Updated",
            };

            const mockUpdatedRestaurant: RestaurantDocument = {
                _id: "restaurant123",
                name: "Only Name Updated",
                address: "Original Address",
                city: "Original City",
                nit: "123456789",
                phone: "+1234567890",
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            } as unknown as RestaurantDocument;

            req.params = { id: "restaurant123" };
            req.body = mockRestaurantUpdate;
            (restaurantService.update as jest.Mock).mockResolvedValue(mockUpdatedRestaurant);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("restaurant123", mockRestaurantUpdate);
            expect(res.json).toHaveBeenCalledWith(mockUpdatedRestaurant);
        });

        it("should handle empty id parameter", async () => {
            
            const mockRestaurantUpdate: RestaurantInputUpdate = {
                name: "Updated Name",
            };

            req.params = {};
            req.body = mockRestaurantUpdate;
            (restaurantService.update as jest.Mock).mockResolvedValue(null);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("", mockRestaurantUpdate);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            const mockRestaurantUpdate: RestaurantInputUpdate = {
                name: "Updated Name",
            };

            req.params = { id: "restaurant123" };
            req.body = mockRestaurantUpdate;
            const error = new Error("Database error");
            (restaurantService.update as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("restaurant123", mockRestaurantUpdate);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should handle empty body", async () => {
            
            req.params = { id: "restaurant123" };
            req.body = {};
            (restaurantService.update as jest.Mock).mockResolvedValue(null);

            
            await restaurantController.update(req as Request, res as Response);

            
            expect(restaurantService.update).toHaveBeenCalledWith("restaurant123", {});
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id restaurant123 not found" 
            });
        });
    });

    
    
    
    describe("delete", () => {
        it("should delete a restaurant and return 204", async () => {
            
            req.params = { id: "restaurant123" };
            (restaurantService.delete as jest.Mock).mockResolvedValue(true);

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(restaurantService.delete).toHaveBeenCalledWith("restaurant123");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("should return 404 if restaurant is not found", async () => {
            
            req.params = { id: "nonexistent123" };
            (restaurantService.delete as jest.Mock).mockResolvedValue(false);

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(restaurantService.delete).toHaveBeenCalledWith("nonexistent123");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id nonexistent123 not found" 
            });
        });

        it("should handle empty id parameter", async () => {
            
            req.params = {};
            (restaurantService.delete as jest.Mock).mockResolvedValue(false);

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(restaurantService.delete).toHaveBeenCalledWith("");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Restaurant with id  not found" 
            });
        });

        it("should return 500 when params is undefined", async () => {
            
            delete req.params;

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.any(TypeError));
        });

        it("should return 500 if an error occurs", async () => {
            
            req.params = { id: "restaurant123" };
            const error = new Error("Database error");
            (restaurantService.delete as jest.Mock).mockRejectedValue(error);

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(restaurantService.delete).toHaveBeenCalledWith("restaurant123");
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(error);
        });

        it("should not call res.json when deletion is successful", async () => {
            
            req.params = { id: "restaurant123" };
            (restaurantService.delete as jest.Mock).mockResolvedValue(true);

            
            await restaurantController.delete(req as Request, res as Response);

            
            expect(restaurantService.delete).toHaveBeenCalledWith("restaurant123");
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});