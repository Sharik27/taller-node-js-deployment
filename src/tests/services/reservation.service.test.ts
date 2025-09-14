import { reservationService } from "../../services";
import { ReservationModel, ReservationDocument, UserModel, UserDocument, RestaurantModel, RestaurantDocument } from "../../models";
import { ReservationInput, ReservationInputUpdate } from "../../interfaces";


jest.mock("../../models", () => ({
  ReservationModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  UserModel: {
    findById: jest.fn(),
  },
  RestaurantModel: {
    findById: jest.fn(),
  },
}));

describe("ReservationService", () => {
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
    it("should create a new reservation when user and restaurant exist", async () => {
      
      const mockReservationInput: ReservationInput = {
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "restaurant123",
        userId: "user123",
        userQuantity: 4,
        status: "confirmed",
      };

      const mockExistingUser: Partial<UserDocument> = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      const mockExistingRestaurant: Partial<RestaurantDocument> = {
        _id: "restaurant123",
        name: "Test Restaurant",
        address: "123 Main St",
        city: "Test City",
        nit: "123456789",
        phone: "555-1234",
      };

      const mockCreatedReservation: Partial<ReservationDocument> = {
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
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockExistingUser);
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(mockExistingRestaurant);
      (ReservationModel.create as jest.Mock).mockResolvedValue(mockCreatedReservation);

      
      const result = await reservationService.create(mockReservationInput);

      
      expect(UserModel.findById).toHaveBeenCalledWith(mockReservationInput.userId);
      expect(RestaurantModel.findById).toHaveBeenCalledWith(mockReservationInput.restaurantId);
      expect(ReservationModel.create).toHaveBeenCalledWith(mockReservationInput);
      expect(result).toEqual(mockCreatedReservation);
    });

    it("should throw ReferenceError when user does not exist", async () => {
      
      const mockReservationInput: ReservationInput = {
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "restaurant123",
        userId: "nonexistent123",
        userQuantity: 4,
        status: "confirmed",
      };

      const mockExistingRestaurant: Partial<RestaurantDocument> = {
        _id: "restaurant123",
        name: "Test Restaurant",
        address: "123 Main St",
        city: "Test City",
        nit: "123456789",
        phone: "555-1234",
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(mockExistingRestaurant);

      
      await expect(reservationService.create(mockReservationInput)).rejects.toThrow(
        new ReferenceError("User not found")
      );

      expect(UserModel.findById).toHaveBeenCalledWith(mockReservationInput.userId);
      expect(RestaurantModel.findById).not.toHaveBeenCalled();
      expect(ReservationModel.create).not.toHaveBeenCalled();
    });

    it("should throw ReferenceError when restaurant does not exist", async () => {
      
      const mockReservationInput: ReservationInput = {
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "nonexistent123",
        userId: "user123",
        userQuantity: 4,
        status: "confirmed",
      };

      const mockExistingUser: Partial<UserDocument> = {
        _id: "user123",
        name: "John Doe",
        email: "john@example.com",
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockExistingUser);
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(null);

      
      await expect(reservationService.create(mockReservationInput)).rejects.toThrow(
        new ReferenceError("Restaurant not found")
      );

      expect(UserModel.findById).toHaveBeenCalledWith(mockReservationInput.userId);
      expect(RestaurantModel.findById).toHaveBeenCalledWith(mockReservationInput.restaurantId);
      expect(ReservationModel.create).not.toHaveBeenCalled();
    });

    it("should throw ReferenceError when both user and restaurant do not exist", async () => {
      
      const mockReservationInput: ReservationInput = {
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "nonexistent456",
        userId: "nonexistent123",
        userQuantity: 4,
        status: "confirmed",
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(null);
      (RestaurantModel.findById as jest.Mock).mockResolvedValue(null);

      
      await expect(reservationService.create(mockReservationInput)).rejects.toThrow(
        new ReferenceError("User not found")
      );

      expect(UserModel.findById).toHaveBeenCalledWith(mockReservationInput.userId);
      expect(RestaurantModel.findById).not.toHaveBeenCalled();
      expect(ReservationModel.create).not.toHaveBeenCalled();
    });
  });

  
  
  
  describe("update", () => {
    it("should update and return the updated reservation", async () => {
      
      const reservationId = "reservation123";
      const mockReservationUpdate: ReservationInputUpdate = {
        hour: "20:00",
        userQuantity: 6,
        status: "confirmed",
      };

      const mockUpdatedReservation: Partial<ReservationDocument> = {
        _id: reservationId,
        date: new Date("2025-01-15"),
        hour: mockReservationUpdate.hour ?? "",
        restaurantId: "restaurant123",
        userId: "user123",
        userQuantity: mockReservationUpdate.userQuantity ?? 0,
        status: mockReservationUpdate.status ?? "",
        createdAt: new Date("2024-12-01"),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (ReservationModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedReservation as ReservationDocument
      );

      
      const result = await reservationService.update(reservationId, mockReservationUpdate);

      
      expect(ReservationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: reservationId },
        mockReservationUpdate,
        { returnOriginal: false }
      );
      expect(result).toEqual(mockUpdatedReservation);
    });

    it("should return null if reservation to update is not found", async () => {
      
      const reservationId = "nonexistent123";
      const mockReservationUpdate: ReservationInputUpdate = {
        status: "cancelled",
      };

      (ReservationModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      
      const result = await reservationService.update(reservationId, mockReservationUpdate);

      
      expect(ReservationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: reservationId },
        mockReservationUpdate,
        { returnOriginal: false }
      );
      expect(result).toBeNull();
    });

    it("should propagate error if update fails", async () => {
      
      const reservationId = "reservation123";
      const mockReservationUpdate: ReservationInputUpdate = {
        status: "cancelled",
      };
      const error = new Error("Database error");

      (ReservationModel.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      
      await expect(
        reservationService.update(reservationId, mockReservationUpdate)
      ).rejects.toThrow(error);

      expect(ReservationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: reservationId },
        mockReservationUpdate,
        { returnOriginal: false }
      );
    });
  });

  
  
  
  describe("getAll", () => {
    it("should return non-deleted reservations with populated restaurant and user", async () => {
      
      const mockReservations: Partial<ReservationDocument>[] = [
        {
          _id: "reservation1",
          date: new Date("2025-01-15"),
          hour: "19:00",
          restaurantId: "restaurant1",
          userId: "user1",
          userQuantity: 4,
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "reservation2",
          date: new Date("2025-01-16"),
          hour: "20:00",
          restaurantId: "restaurant2",
          userId: "user2",
          userQuantity: 2,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      const populateRestaurantMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservations),
      });

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: populateRestaurantMock,
      });

      
      const result = await reservationService.getAll();

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(populateRestaurantMock).toHaveBeenCalledWith("restaurantId", "name address");
      expect(result).toEqual(mockReservations);
    });

    it("should return empty array if no reservations", async () => {
      
      const populateRestaurantMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: populateRestaurantMock,
      });

      
      const result = await reservationService.getAll();

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result).toEqual([]);
    });
  });

  
  
  
  describe("getById", () => {
    it("should return a reservation by id with populated restaurant and user", async () => {
      
      const reservationId = "reservation123";
      const mockReservation: Partial<ReservationDocument> = {
        _id: reservationId,
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "restaurant123",
        userId: "user123",
        userQuantity: 4,
        status: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const populateRestaurantMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservation),
      });

      (ReservationModel.findById as jest.Mock).mockReturnValue({
        populate: populateRestaurantMock,
      });

      
      const result = await reservationService.getById(reservationId);

      
      expect(ReservationModel.findById).toHaveBeenCalledWith(reservationId);
      expect(populateRestaurantMock).toHaveBeenCalledWith("restaurantId", "name address");
      expect(result).toEqual(mockReservation);
    });

    it("should return null if reservation is not found", async () => {
      
      const reservationId = "nonexistent123";

      const populateRestaurantMock = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      (ReservationModel.findById as jest.Mock).mockReturnValue({
        populate: populateRestaurantMock,
      });

      
      const result = await reservationService.getById(reservationId);

      
      expect(ReservationModel.findById).toHaveBeenCalledWith(reservationId);
      expect(result).toBeNull();
    });
  });

  
  
  
  describe("delete", () => {
    it("should soft-delete a reservation and return true", async () => {
      
      const reservationId = "reservation123";
      const mockDeletedReservation: Partial<ReservationDocument> = {
        _id: reservationId,
        date: new Date("2025-01-15"),
        hour: "19:00",
        restaurantId: "restaurant123",
        userId: "user123",
        userQuantity: 4,
        status: "cancelled",
        deletedAt: new Date(),
      };

      (ReservationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockDeletedReservation as ReservationDocument
      );

      
      const result = await reservationService.delete(reservationId);

      
      expect(ReservationModel.findByIdAndUpdate).toHaveBeenCalledWith(reservationId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it("should return false if reservation to delete is not found", async () => {
      
      const reservationId = "nonexistent123";

      (ReservationModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      
      const result = await reservationService.delete(reservationId);

      
      expect(ReservationModel.findByIdAndUpdate).toHaveBeenCalledWith(reservationId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(false);
    });

    it("should propagate error if delete fails", async () => {
      
      const reservationId = "reservation123";
      const error = new Error("Database error");

      (ReservationModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(error);

      
      await expect(reservationService.delete(reservationId)).rejects.toThrow(error);

      expect(ReservationModel.findByIdAndUpdate).toHaveBeenCalledWith(reservationId, {
        deletedAt: expect.any(Date),
      });
    });
  });

  
  
  
  describe("getByUserId", () => {
    it("should return reservations by user id with populated user", async () => {
      
      const userId = "user123";
      const mockReservations: Partial<ReservationDocument>[] = [
        {
          _id: "reservation1",
          date: new Date("2025-01-15"),
          hour: "19:00",
          restaurantId: "restaurant1",
          userId: userId,
          userQuantity: 4,
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "reservation2",
          date: new Date("2025-01-20"),
          hour: "18:30",
          restaurantId: "restaurant2",
          userId: userId,
          userQuantity: 2,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservations),
      });

      
      const result = await reservationService.getByUserId(userId);

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ userId: userId });
      expect(result).toEqual(mockReservations);
    });

    it("should return empty array if user has no reservations", async () => {
      
      const userId = "user123";

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      
      const result = await reservationService.getByUserId(userId);

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ userId: userId });
      expect(result).toEqual([]);
    });
  });

  
  
  
  describe("getByRestaurantId", () => {
    it("should return reservations by restaurant id with populated restaurant", async () => {
      
      const restaurantId = "restaurant123";
      const mockReservations: Partial<ReservationDocument>[] = [
        {
          _id: "reservation1",
          date: new Date("2025-01-15"),
          hour: "19:00",
          restaurantId: restaurantId,
          userId: "user1",
          userQuantity: 4,
          status: "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "reservation2",
          date: new Date("2025-01-16"),
          hour: "20:00",
          restaurantId: restaurantId,
          userId: "user2",
          userQuantity: 6,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReservations),
      });

      
      const result = await reservationService.getByRestaurantId(restaurantId);

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ restaurantId: restaurantId });
      expect(result).toEqual(mockReservations);
    });

    it("should return empty array if restaurant has no reservations", async () => {
      
      const restaurantId = "restaurant123";

      (ReservationModel.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      
      const result = await reservationService.getByRestaurantId(restaurantId);

      
      expect(ReservationModel.find).toHaveBeenCalledWith({ restaurantId: restaurantId });
      expect(result).toEqual([]);
    });
  });
});