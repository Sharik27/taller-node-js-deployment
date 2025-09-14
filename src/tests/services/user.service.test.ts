import { userService } from "../../services";
import { UserModel, UserDocument, UserRole } from "../../models";
import bcrypt from "bcrypt";
import { UserInput, UserInputUpdate } from "../../interfaces";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

jest.mock("../../models", () => ({
  UserRole: { ADMIN: "admin", USER: "user" },
  UserModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

describe("UserService", () => {
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
    it("creates a new user with a hashed password and omits password in the result", async () => {
      const mockUserInput: UserInput = {
        name: "Alice Smith",
        email: "alice.smith@acme.dev",
        password: "s3cretPass",
      };

      const mockHashedPassword = "hash$abc123";

      const mockCreatedUser: Partial<UserDocument> & {
        toObject: () => Partial<UserDocument>;
      } = {
        _id: "usr_abc123",
        name: mockUserInput.name,
        email: mockUserInput.email,
        roles: [UserRole.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: "usr_abc123",
          name: mockUserInput.name,
          email: mockUserInput.email,
          roles: [UserRole.USER],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      jest.spyOn(userService, "findByEmail").mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
      (UserModel.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await userService.create(mockUserInput);

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserInput.password, 10);
      expect(UserModel.create).toHaveBeenCalledWith({
        ...mockUserInput,
        password: mockHashedPassword,
      });
      expect(result).toEqual(mockCreatedUser.toObject());
      expect((result as Partial<UserDocument>).password).toBeUndefined();
    });

    it("throws ReferenceError when the email is already registered", async () => {
      const mockUserInput: UserInput = {
        name: "Alice Smith",
        email: "alice.smith@acme.dev",
        password: "s3cretPass",
      };

      const existingUser: Partial<UserDocument> = {
        _id: "usr_abc123",
        name: "Alice Smith",
        email: "alice.smith@acme.dev",
        roles: [UserRole.USER],
      };

      jest
        .spyOn(userService, "findByEmail")
        .mockResolvedValue(existingUser as UserDocument);

      await expect(userService.create(mockUserInput)).rejects.toThrow(
        ReferenceError
      );
      await expect(userService.create(mockUserInput)).rejects.toThrow(
        "User already exists"
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("propagates an error when password hashing fails", async () => {
      const mockUserInput: UserInput = {
        name: "Alice Smith",
        email: "alice.smith@acme.dev",
        password: "s3cretPass",
      };

      const hashError = new Error("Hashing failed");

      jest.spyOn(userService, "findByEmail").mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(hashError);

      await expect(userService.create(mockUserInput)).rejects.toThrow(hashError);

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserInput.password, 10);
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });

  describe("findByEmail", () => {
    it("finds a user by email and includes the password when password=true", async () => {
      const email = "dev.two@acme.dev";
      const mockUserWithPassword: Partial<UserDocument> & {
        password?: string;
      } = {
        _id: "u-2",
        name: "Dev Two",
        email,
        roles: [UserRole.USER],
        password: "hash$pass",
      };

      const selectMock = jest
        .fn()
        .mockResolvedValue(mockUserWithPassword as UserDocument);

      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await userService.findByEmail(email, true);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email });
      expect(selectMock).toHaveBeenCalledWith("+password");
      expect(result).toEqual(mockUserWithPassword);
      expect((result as any).password).toBeDefined();
    });

    it("finds a user by email and excludes the password by default", async () => {
      const email = "dev.one@acme.dev";
      const mockUser: Partial<UserDocument> = {
        _id: "u-1",
        name: "Dev One",
        email,
        roles: [UserRole.USER],
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser as UserDocument);

      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await userService.findByEmail(email);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email });
      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(result).toEqual(mockUser);
    });

    it("returns null when a user is not found", async () => {
      const email = "nobody@nowhere.dev";
      const selectMock = jest.fn().mockResolvedValue(null);

      (UserModel.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await userService.findByEmail(email);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email });
      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    it("returns an empty array when there are no users", async () => {
      (UserModel.find as jest.Mock).mockResolvedValue([]);

      const result = await userService.getAll();

      expect(UserModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("returns all users with deletedAt=null", async () => {
      const mockUsers: Partial<UserDocument>[] = [
        {
          _id: "u10",
          name: "Alice Smith",
          email: "alice@acme.dev",
          roles: [UserRole.USER],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          _id: "u20",
          name: "Bob Admin",
          email: "bob@acme.dev",
          roles: [UserRole.ADMIN],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      (UserModel.find as jest.Mock).mockResolvedValue(
        mockUsers as UserDocument[]
      );

      const result = await userService.getAll();

      expect(UserModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    it("handles database error when getting all users", async () => {
      const dbError = new Error("Database connection timeout");

      (UserModel.find as jest.Mock).mockRejectedValue(dbError);

      await expect(userService.getAll()).rejects.toThrow(dbError);

      expect(UserModel.find).toHaveBeenCalledWith({ deletedAt: null });
    });
  });

  describe("getById", () => {
    it("returns a user by id", async () => {
      const userId = "usr_42";
      const mockUser: Partial<UserDocument> = {
        _id: userId,
        name: "Alice Smith",
        email: "alice@acme.dev",
        roles: [UserRole.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserModel.findById as jest.Mock).mockResolvedValue(
        mockUser as UserDocument
      );

      const result = await userService.getById(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it("returns null when no user matches the id", async () => {
      const userId = "usr_missing_123";

      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await userService.getById(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it("propagates a database error when fetching by id fails", async () => {
      const userId = "usr_err_500";
      const dbError = new Error("Invalid ObjectId format");

      (UserModel.findById as jest.Mock).mockRejectedValue(dbError);

      await expect(userService.getById(userId)).rejects.toThrow(dbError);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe("update", () => {
    it("returs  null when the user to update does not exist", async () => {
      const userId = "usr_none_1";
      const mockUserUpdate: UserInputUpdate = {
        name: "Alex Updated",
        email: "alex.updated@acme.dev",
      };

      (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await userService.update(userId, mockUserUpdate);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        mockUserUpdate,
        { returnOriginal: false }
      );
      expect(result).toBeNull();
    });

    it("updates a user and return updated document", async () => {
      const userId = "usr_u1";
      const mockUserUpdate: UserInputUpdate = {
        name: "Alicia Updated",
        email: "alicia.updated@acme.dev",
      };

      const mockUpdatedUser: Partial<UserDocument> = {
        _id: userId,
        name: "Alicia Updated",
        email: "alicia.updated@acme.dev",
        roles: [UserRole.USER],
        updatedAt: new Date(),
      };

      (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
        mockUpdatedUser as UserDocument
      );

      const result = await userService.update(userId, mockUserUpdate);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        mockUserUpdate,
        { returnOriginal: false }
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("propagates an error when the update operation fails", async () => {
      const userId = "usr_u2";
      const mockUserUpdate: UserInputUpdate = {
        name: "Casey Updated",
        email: "casey.updated@acme.dev",
      };
      const updateError = new Error("Database connection failed");

      (UserModel.findOneAndUpdate as jest.Mock).mockRejectedValue(updateError);

      await expect(userService.update(userId, mockUserUpdate)).rejects.toThrow(
        updateError
      );

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        mockUserUpdate,
        { returnOriginal: false }
      );
    });
  });

  describe("delete", () => {
    it("returns false when the user to delete does not exist", async () => {
      const userId = "usr_del_missing";

      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await userService.delete(userId);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(false);
    });

    it("propagates an error when the delete operation fails", async () => {
      const userId = "usr_del_err";
      const deleteError = new Error("Database write operation failed");

      (UserModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(deleteError);

      await expect(userService.delete(userId)).rejects.toThrow(deleteError);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        deletedAt: expect.any(Date),
      });
    });

    it("soft-deletes a user and returns true", async () => {
      const userId = "usr_del_ok";
      const mockDeletedUser: Partial<UserDocument> = {
        _id: userId,
        name: "Alice Smith",
        email: "alice@acme.dev",
        deletedAt: new Date(),
      };

      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockDeletedUser as UserDocument
      );

      const result = await userService.delete(userId);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        deletedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });
});
