import { restaurantService } from "../../services";
import { RestaurantModel, RestaurantDocument } from "../../models";
import { RestaurantInput, RestaurantInputUpdate } from "../../interfaces";


jest.mock("../../models", () => ({
  RestaurantModel: {
    create: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("RestaurantService", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  
  
  
  describe("create", () => {
    it("should create a new restaurant successfully", async () => {
      
      const mockRestaurantInput: RestaurantInput = {
        name: "La Pizzería",
        address: "Calle 123 #45-67",
        city: "Bogotá",
        nit: "900123456-1",
        phone: "+57 1 234-5678",
      };

      const mockCreatedRestaurant: Partial<RestaurantDocument> = {
        _id: "restaurant123",
        name: mockRestaurantInput.name,
        address: mockRestaurantInput.address,
        city: mockRestaurantInput.city,
        nit: mockRestaurantInput.nit,
        phone: mockRestaurantInput.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      
      (RestaurantModel.exists as jest.Mock).mockResolvedValue(null);
      (RestaurantModel.create as jest.Mock).mockResolvedValue(
        mockCreatedRestaurant as RestaurantDocument
      );

      
      const result = await restaurantService.create(mockRestaurantInput);

      
      expect(RestaurantModel.exists).toHaveBeenCalledWith({ nit: mockRestaurantInput.nit });
      expect(RestaurantModel.create).toHaveBeenCalledWith(mockRestaurantInput);
      expect(result).toEqual(mockCreatedRestaurant);
    });

    it("should throw ReferenceError if restaurant with same NIT already exists", async () => {
      
      const mockRestaurantInput: RestaurantInput = {
        name: "El Asadero",
        address: "Carrera 50 #23-45",
        city: "Medellín",
        nit: "800456789-2",
        phone: "+57 4 567-8901",
      };

      const existingRestaurant = { _id: "existing123" };

      
      (RestaurantModel.exists as jest.Mock).mockResolvedValue(existingRestaurant);

      
      await expect(restaurantService.create(mockRestaurantInput)).rejects.toThrow(
        ReferenceError
      );
      await expect(restaurantService.create(mockRestaurantInput)).rejects.toThrow(
        "Restaurant already exist"
      );

      expect(RestaurantModel.exists).toHaveBeenCalledWith({ nit: mockRestaurantInput.nit });
      expect(RestaurantModel.create).not.toHaveBeenCalled();
    });

    it("should handle database error when checking if restaurant exists", async () => {
      
      const mockRestaurantInput: RestaurantInput = {
        name: "Sushi House",
        address: "Avenida 68 #12-34",
        city: "Cali",
        nit: "700789123-5",
        phone: "+57 2 345-6789",
      };

      const dbError = new Error("Database connection failed");

      
      (RestaurantModel.exists as jest.Mock).mockRejectedValue(dbError);

      
      await expect(restaurantService.create(mockRestaurantInput)).rejects.toThrow(dbError);

      expect(RestaurantModel.exists).toHaveBeenCalledWith({ nit: mockRestaurantInput.nit });
      expect(RestaurantModel.create).not.toHaveBeenCalled();
    });

    it("should handle database error when creating restaurant", async () => {
      
      const mockRestaurantInput: RestaurantInput = {
        name: "Burger Palace",
        address: "Calle 85 #15-30",
        city: "Barranquilla",
        nit: "600345678-9",
        phone: "+57 5 234-5678",
      };

      const createError = new Error("Failed to create restaurant");

      
      (RestaurantModel.exists as jest.Mock).mockResolvedValue(null);
      (RestaurantModel.create as jest.Mock).mockRejectedValue(createError);

      
      await expect(restaurantService.create(mockRestaurantInput)).rejects.toThrow(createError);

      expect(RestaurantModel.exists).toHaveBeenCalledWith({ nit: mockRestaurantInput.nit });
      expect(RestaurantModel.create).toHaveBeenCalledWith(mockRestaurantInput);
    });
  });

  
  
  
  describe("update", () => {
    it("should update restaurant successfully and return updated restaurant", async () => {
      
      const restaurantId = "restaurant123";
      const mockRestaurantUpdate: RestaurantInputUpdate = {
        name: "La Pizzería Deluxe",
        address: "Nueva Calle 456 #78-90",
        city: "Bogotá",
        phone: "+57 1 456-7890",
      };

      const mockUpdatedRestaurant: Partial<RestaurantDocument> = {
        _id: restaurantId,
        name: "La Pizzería Deluxe",
        address: "Nueva Calle 456 #78-90",
        city: "Bogotá",
        nit: "900123456-1",
        phone: "+57 1 456-7890",
        updatedAt: new Date(),
        deletedAt: null,
      };

      
      (RestaurantModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedRestaurant as RestaurantDocument
      );

      
      const result = await restaurantService.update(restaurantId, mockRestaurantUpdate);

      
      expect(RestaurantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: restaurantId },
        mockRestaurantUpdate,
        { returnOriginal: false }
      );
      expect(result).toEqual(mockUpdatedRestaurant);
    });

    it("should return null if restaurant to update is not found", async () => {
      
      const restaurantId = "nonexistent123";
      const mockRestaurantUpdate: RestaurantInputUpdate = {
        name: "Updated Restaurant",
        phone: "+57 1 999-9999",
      };

      
      (RestaurantModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      
      const result = await restaurantService.update(restaurantId, mockRestaurantUpdate);

      
      expect(RestaurantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: restaurantId },
        mockRestaurantUpdate,
        { returnOriginal: false }
      );
      expect(result).toBeNull();
    });

    it("should propagate error if update operation fails", async () => {
      
      const restaurantId = "restaurant123";
      const mockRestaurantUpdate: RestaurantInputUpdate = {
        name: "Updated Name",
        city: "Updated City",
      };
      const updateError = new Error("Database update operation failed");

      
      (RestaurantModel.findOneAndUpdate as jest.Mock).mockRejectedValue(updateError);

      
      await expect(restaurantService.update(restaurantId, mockRestaurantUpdate)).rejects.toThrow(
        updateError
      );

      expect(RestaurantModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: restaurantId },
        mockRestaurantUpdate,
        { returnOriginal: false }
      );
    });
  });

  
  
  
  describe("getAll", () => {
    it("should return all non-deleted restaurants", async () => {
      
      const mockRestaurants: Partial<RestaurantDocument>[] = [
        {
          _id: "restaurant1",
          name: "La Pizzería",
          address: "Calle 123 #45-67",
          city: "Bogotá",
          nit: "900123456-1",
          phone: "+57 1 234-5678",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "restaurant2",
          name: "El Asadero",
          address: "Carrera 50 #23-45",
          city: "Medellín",
          nit: "800456789-2",
          phone: "+57 4 567-8901",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "restaurant3",
          name: "Sushi House",
          address: "Avenida 68 #12-34",
          city: "Cali",
          nit: "700789123-5",
          phone: "+57 2 345-6789",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      
      (RestaurantModel.find as jest.Mock).mockResolvedValue(mockRestaurants as RestaurantDocument[]);

      
      const result = await restaurantService.getAll();

      
      expect(RestaurantModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result).toEqual(mockRestaurants);
      expect(result).toHaveLength(3);
    });

    it("should return empty array if no restaurants exist", async () => {
      
      
      (RestaurantModel.find as jest.Mock).mockResolvedValue([]);

      
      const result = await restaurantService.getAll();

      
      expect(RestaurantModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle database error when getting all restaurants", async () => {
      
      const dbError = new Error("Database connection timeout");

      
      (RestaurantModel.find as jest.Mock).mockRejectedValue(dbError);

      
      await expect(restaurantService.getAll()).rejects.toThrow(dbError);

      expect(RestaurantModel.find).toHaveBeenCalledWith({ deletedAt: null });
    });
  });

  
  
  
  describe("getById", () => {
    it("should return restaurant by id", async () => {
      
      const restaurantId = "restaurant123";
      const mockRestaurant: Partial<RestaurantDocument> = {
        _id: restaurantId,
        name: "La Pizzería",
        address: "Calle 123 #45-67",
        city: "Bogotá",
        nit: "900123456-1",
        phone: "+57 1 234-5678",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(mockRestaurant as RestaurantDocument);

      
      const result = await restaurantService.getById(restaurantId);

      
      expect(RestaurantModel.findById).toHaveBeenCalledWith(restaurantId);
      expect(result).toEqual(mockRestaurant);
    });

    it("should return null if restaurant is not found by id", async () => {
      
      const restaurantId = "nonexistent123";

      
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(null);

      
      const result = await restaurantService.getById(restaurantId);

      
      expect(RestaurantModel.findById).toHaveBeenCalledWith(restaurantId);
      expect(result).toBeNull();
    });

    it("should handle database error when getting restaurant by id", async () => {
      
      const restaurantId = "restaurant123";
      const dbError = new Error("Invalid ObjectId format");

      
      (RestaurantModel.findById as jest.Mock).mockRejectedValue(dbError);

      
      await expect(restaurantService.getById(restaurantId)).rejects.toThrow(dbError);

      expect(RestaurantModel.findById).toHaveBeenCalledWith(restaurantId);
    });
  });

  
  
  
  describe("delete", () => {
    it("should soft-delete restaurant successfully and return true", async () => {
      
      const restaurantId = "restaurant123";
      const mockDeletedRestaurant: Partial<RestaurantDocument> = {
        _id: restaurantId,
        name: "La Pizzería",
        address: "Calle 123 #45-67",
        city: "Bogotá",
        nit: "900123456-1",
        phone: "+57 1 234-5678",
        deletedAt: new Date(),
      };

      
      (RestaurantModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockDeletedRestaurant as RestaurantDocument
      );

      
      const result = await restaurantService.delete(restaurantId);

      
      expect(RestaurantModel.findByIdAndUpdate).toHaveBeenCalledWith(restaurantId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it("should return false if restaurant to delete is not found", async () => {
      
      const restaurantId = "nonexistent123";

      
      (RestaurantModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      
      const result = await restaurantService.delete(restaurantId);

      
      expect(RestaurantModel.findByIdAndUpdate).toHaveBeenCalledWith(restaurantId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(false);
    });

    it("should propagate error if delete operation fails", async () => {
      
      const restaurantId = "restaurant123";
      const deleteError = new Error("Database write operation failed");

      
      (RestaurantModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(deleteError);

      
      await expect(restaurantService.delete(restaurantId)).rejects.toThrow(deleteError);

      expect(RestaurantModel.findByIdAndUpdate).toHaveBeenCalledWith(restaurantId, {
        deletedAt: expect.any(Date),
      });
    });
  });
});