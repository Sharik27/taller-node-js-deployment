import { authController } from "../../controllers/auth.controller";
import { authService } from "../../services";
import { Request, Response } from "express";
import { UserLoginInput, UserLoginOutput } from "../../interfaces";


jest.mock("../../services", () => ({
    authService: {
        login: jest.fn(),
    },
}));

describe("AuthController", () => {
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

    describe("login", () => {
        it("logs in a valid user and returns a JWT token", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "P@ssw0rd42!",
            };

            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("returns 401 if the user does not exist", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "ghost@void.dev",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("User not found");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });

        it("returns 401 if the provided password is incorrect", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "Wrong#2025",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Password mismatch");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Password mismatch" });
        });

        it("returns 401 if the credentials are invalid", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "bogus@mail.invalid",
                password: "Wrong#2025",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Invalid credentials");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
        });

        it("returns 500 for unexpected server errors", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new Error("Primary database connection lost");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
        });

        it("handles login when the request body is empty", async () => {
            req.body = {};
            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith({});
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("handles login when the request body is missing", async () => {
            req.body = undefined;
            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(undefined);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("should handle partial login data", async () => {
            const mockPartialLoginInput = {
                email: "nina@site.dev",
            };

            req.body = mockPartialLoginInput;
            const error = new ReferenceError("Missing password");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockPartialLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing password" });
        });

        it("logs in successfully with an admin user account", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "root@corp.dev",
                password: "Adm1n#Pass!",
            };

            const mockAdminLoginOutput: UserLoginOutput = {
                id: "adm_007",
                roles: ["admin", "user"],
                token: "eyJ.admin.mock.007",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockAdminLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockAdminLoginOutput });
        });

        it("logs in successfully with an email containing special characters", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "dev.team+qa@sub.example.org",
                password: "P@ssw0rd42!",
            };

            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("returns 401 if token generation fails", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Token generation failed");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Token generation failed" });
        });

        it("returns 401 if the user account is disabled", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "blocked@domain.app",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Account disabled");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Account disabled" });
        });

        it("returns 401 if the email format is invalid", async () => {
            const mockLoginInput = {
                email: "not-an-email",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Invalid email format");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid email format" });
        });

        it("returns 401 if email field is missing in request body", async () => {
            const mockPartialLoginInput = {
                password: "P@ssw0rd42!",
            };

            req.body = mockPartialLoginInput;
            const error = new ReferenceError("Missing email");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockPartialLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing email" });
        });

        it("returns 401 if email field is an empty string", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Email cannot be empty");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Email cannot be empty" });
        });

        it("does not expose sensitive error details to the client", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new Error("Confidential database fault: URI exposure");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
            expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining("database")
            }));
        });

        it("logs in successfully with a very long password", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "x".repeat(1000),
            };

            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("handles login with case-sensitive email addresses", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "MIXED.CASE@MAIL.NET",
                password: "P@ssw0rd42!",
            };

            const mockLoginOutput: UserLoginOutput = {
                id: "u_42a9",
                roles: ["user"],
                token: "eyJ.mock.123",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("returns 401 if password field is an empty string", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "alice@test.io",
                password: "",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Password cannot be empty");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Password cannot be empty" });
        });

        it("logs in successfully when JWT contains multiple roles", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "power.user@product.io",
                password: "Sup3r#Pass!",
            };

            const mockLoginOutput: UserLoginOutput = {
                id: "su_9001",
                roles: ["admin", "user", "moderator"],
                token: "eyJ.super.mock.9001",
            };

            req.body = mockLoginInput;
            (authService.login as jest.Mock).mockResolvedValue(mockLoginOutput);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.json).toHaveBeenCalledWith({ token: mockLoginOutput });
        });

        it("returns 401 if the user account has been deleted", async () => {
            const mockLoginInput: UserLoginInput = {
                email: "deleted.user@trash.me",
                password: "P@ssw0rd42!",
            };

            req.body = mockLoginInput;
            const error = new ReferenceError("Account has been deleted");
            (authService.login as jest.Mock).mockRejectedValue(error);

            await authController.login(req as Request, res as Response);

            expect(authService.login).toHaveBeenCalledWith(mockLoginInput);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Account has been deleted" });
        });
    });
});
