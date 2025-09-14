import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { authService } from "../../services";
import { userService } from "../../services/user.service";
import { UserLoginInput, UserLoginOutput } from "../../interfaces";
import { UserDocument, UserRole } from "../../models";


jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));


jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));


describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    delete process.env.JWT_SECRET;
  });

  describe("login", () => {
    it("should throw ReferenceError when user does not exist", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "ghost@acme.io",
        password: "letmein42",
      };

      jest.spyOn(userService, "findByEmail").mockResolvedValue(null);

      await expect(authService.login(mockUserLogin)).rejects.toThrow(
        new ReferenceError("Not Authorized")
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserLogin.email, true);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should successfully login user with correct credentials", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "maya@acme.io",
        password: "letmein42",
      };

      const mockExistingUser: Partial<UserDocument> = {
        id: "u-101",
        name: "Maya Lane",
        email: "maya@acme.io",
        password: "$2b$10$mockHashA",
        roles: [UserRole.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const expectedToken = "jwt.mock.token.1";
      const expectedOutput: UserLoginOutput = {
        id: "u-101",
        roles: [UserRole.USER],
        token: expectedToken,
      };

      jest.spyOn(userService, "findByEmail").mockResolvedValue(mockExistingUser as UserDocument);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(authService, "generateToken").mockResolvedValue(expectedToken);

      const result = await authService.login(mockUserLogin);

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserLogin.email, true);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockUserLogin.password, mockExistingUser.password);
      expect(authService.generateToken).toHaveBeenCalledWith(mockExistingUser);
      expect(result).toEqual(expectedOutput);
    });

    it("should handle user with admin role", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "root@acme.io",
        password: "rootpass!",
      };

      const mockAdminUser: Partial<UserDocument> = {
        id: "admin-7",
        name: "Root User",
        email: "root@acme.io",
        password: "$2b$10$mockHashB",
        roles: [UserRole.ADMIN, UserRole.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const expectedToken = "jwt.mock.admin.7";
      const expectedOutput: UserLoginOutput = {
        id: "admin-7",
        roles: [UserRole.ADMIN, UserRole.USER],
        token: expectedToken,
      };

      jest.spyOn(userService, "findByEmail").mockResolvedValue(mockAdminUser as UserDocument);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(authService, "generateToken").mockResolvedValue(expectedToken);

      const result = await authService.login(mockUserLogin);

      expect(result).toEqual(expectedOutput);
      expect(result.roles).toContain(UserRole.ADMIN);
      expect(result.roles).toContain(UserRole.USER);
    });
   

    it("should throw ReferenceError when password is incorrect", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "maya@acme.io",
        password: "wrong-pass",
      };

      const mockExistingUser: Partial<UserDocument> = {
        id: "u-101",
        name: "Maya Lane",
        email: "maya@acme.io",
        password: "$2b$10$mockHashA",
        roles: [UserRole.USER],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(userService, "findByEmail").mockResolvedValue(mockExistingUser as UserDocument);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(mockUserLogin)).rejects.toThrow(
        new ReferenceError("Not Authorized")
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserLogin.email, true);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockUserLogin.password, mockExistingUser.password);
    });

    it("should propagate error if bcrypt.compare fails", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "maya@acme.io",
        password: "letmein42",
      };

      const mockExistingUser: Partial<UserDocument> = {
        id: "u-101",
        name: "Maya Lane",
        email: "maya@acme.io",
        password: "$2b$10$mockHashA",
        roles: [UserRole.USER],
      };

      const error = new Error("Bcrypt error");

      jest.spyOn(userService, "findByEmail").mockResolvedValue(mockExistingUser as UserDocument);
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      await expect(authService.login(mockUserLogin)).rejects.toThrow(error);

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserLogin.email, true);
      expect(bcrypt.compare).toHaveBeenCalledWith(mockUserLogin.password, mockExistingUser.password);
    });

    it("should propagate error if userService.findByEmail fails", async () => {
      const mockUserLogin: UserLoginInput = {
        email: "maya@acme.io",
        password: "letmein42",
      };
      const error = new Error("Database error");

      jest.spyOn(userService, "findByEmail").mockRejectedValue(error);

      await expect(authService.login(mockUserLogin)).rejects.toThrow(error);

      expect(userService.findByEmail).toHaveBeenCalledWith(mockUserLogin.email, true);
    });

    
  });

  describe("generateToken", () => {
    it("should generate token with default secret when JWT_SECRET is not set", async () => {
      const mockUser: Partial<UserDocument> = {
        id: "u-777",
        name: "Janet K",
        email: "janet@acme.io",
        roles: [UserRole.ADMIN],
      };

      const expectedToken = "tok.default.777";
      delete process.env.JWT_SECRET;

      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = await authService.generateToken(mockUser as UserDocument);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          roles: mockUser.roles,
        },
        'defaultSecret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });

    it("should generate token with user payload and custom JWT_SECRET", async () => {
      const mockUser: Partial<UserDocument> = {
        id: "u-555",
        name: "Maya Lane",
        email: "maya@acme.io",
        roles: [UserRole.USER],
      };

      const expectedToken = "tok.custom.555";
      const customSecret = "s3cr3t!";
      process.env.JWT_SECRET = customSecret;

      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = await authService.generateToken(mockUser as UserDocument);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          roles: mockUser.roles,
        },
        customSecret,
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });


    it("should generate token for user with multiple roles", async () => {
      const mockUser: Partial<UserDocument> = {
        id: "u-900",
        name: "Super Admin",
        email: "super@acme.io",
        roles: [UserRole.ADMIN, UserRole.USER],
      };

      const expectedToken = "tok.multi.900";
      process.env.JWT_SECRET = "t0pSecret";

      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = await authService.generateToken(mockUser as UserDocument);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          roles: [UserRole.ADMIN, UserRole.USER],
        },
        't0pSecret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });

    it("should propagate error if jwt.sign fails", async () => {
      const mockUser: Partial<UserDocument> = {
        id: "u-err-1",
        name: "Maya Lane",
        email: "maya@acme.io",
        roles: [UserRole.USER],
      };

      const error = new Error("JWT signing error");
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(authService.generateToken(mockUser as UserDocument)).rejects.toThrow(error);
    });

    it("should handle user with empty roles array", async () => {
      const mockUser: Partial<UserDocument> = {
        id: "u-nr",
        name: "No Roles",
        email: "noroles@acme.io",
        roles: [],
      };

      const expectedToken = "tok.empty.roles";
      (jwt.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = await authService.generateToken(mockUser as UserDocument);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          roles: [],
        },
        'defaultSecret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(expectedToken);
    });
  });
});
