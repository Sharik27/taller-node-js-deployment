import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../../middlewares/auth.middleware"; 
import { JwtCustomPayload } from "../../types";


jest.mock("jsonwebtoken", () => ({
    verify: jest.fn(),
}));

describe("AuthMiddleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let mockJwtVerify: jest.Mock;

    beforeEach(() => {
        req = {
            headers: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        mockJwtVerify = jwt.verify as jest.Mock;
        
        
        process.env.JWT_SECRET = "testSecret";
        
        jest.clearAllMocks();
    });

    afterEach(() => {
        
        delete process.env.JWT_SECRET;
    });

    describe("successful authentication", () => {
        it("authenticates a user with a valid token and calls next()", () => {
            const mockPayload: JwtCustomPayload = {
                id: "usr_001",
                roles: ["user"],
                iat: 1710000001,
                exp: 1810000001,
            };

            req.headers = {
                authorization: "Bearer tok_ok_X9Y7Z3",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_ok_X9Y7Z3", "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it("authenticates an admin user with a valid token", () => {
            const mockPayload: JwtCustomPayload = {
                id: "adm_999",
                roles: ["admin", "user"],
                iat: 1710000100,
                exp: 1810000100,
            };

            req.headers = {
                authorization: "Bearer tok_admin_QWERTY",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_admin_QWERTY", "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });

        it("authenticates a user when the JWT payload includes extra standard claims", () => {
            const mockPayload: JwtCustomPayload = {
                id: "usr_777",
                roles: ["user"],
                iat: 1710000200,
                exp: 1810000200,
                iss: "acme-auth",
                aud: "webapp",
                sub: "usr_777",
            };

            req.headers = {
                authorization: "Bearer tok_full_9f8e7d",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_full_9f8e7d", "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("missing token cases", () => {
        it("returns 401 when the Authorization header is undefined", () => {
            req.headers = {
                authorization: undefined,
            };

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 401 when the Authorization header is an empty string", () => {
            req.headers = {
                authorization: "",
            };

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 401 when the Authorization header is missing", () => {
            req.headers = {};

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(next).not.toHaveBeenCalled();
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        it("returns 401 when the Bearer token value is empty", () => {
            req.headers = {
                authorization: "Bearer ",
            };

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when the Authorization scheme is not Bearer", () => {
            req.headers = {
                authorization: "Basic alice:secret",
            };
            
            const jwtError = new Error("JsonWebTokenError: invalid token");
            jwtError.name = "JsonWebTokenError";
            mockJwtVerify.mockImplementation(() => {
                throw jwtError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid token." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 401 when the Authorization header is only 'Bearer' without a token", () => {
            req.headers = {
                authorization: "Bearer",
            };

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("invalid token cases", () => {
        it("returns 403 when the token is expired", () => {
            req.headers = {
                authorization: "Bearer tok_expired_001",
            };
            const expiredError = new Error("TokenExpiredError: jwt expired");
            expiredError.name = "TokenExpiredError";
            mockJwtVerify.mockImplementation(() => {
                throw expiredError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_expired_001", "testSecret");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when jwt.verify throws a JsonWebTokenError", () => {
            req.headers = {
                authorization: "Bearer tok_bad_sig_002",
            };
            const jwtError = new Error("JsonWebTokenError: invalid signature");
            jwtError.name = "JsonWebTokenError";
            mockJwtVerify.mockImplementation(() => {
                throw jwtError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_bad_sig_002", "testSecret");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
            expect(next).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        it("returns 403 when the token is malformed", () => {
            req.headers = {
                authorization: "Bearer tok.malformed.003",
            };
            const malformedError = new Error("JsonWebTokenError: invalid token");
            mockJwtVerify.mockImplementation(() => {
                throw malformedError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok.malformed.003", "testSecret");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when jwt.verify throws a generic error", () => {
            req.headers = {
                authorization: "Bearer tok_generic_err_004",
            };
            const genericError = new Error("Unknown JWT error");
            mockJwtVerify.mockImplementation(() => {
                throw genericError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_generic_err_004", "testSecret");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("environment and configuration", () => {
        it("uses the default secret when JWT_SECRET is not set", () => {
            delete process.env.JWT_SECRET;
            const mockPayload: JwtCustomPayload = {
                id: "usr_env_001",
                roles: ["user"],
                iat: 1710000300,
                exp: 1810000300,
            };

            req.headers = {
                authorization: "Bearer tok_env_default",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_env_default", "defaultSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });

        it("should handle empty JWT_SECRET environment variable", () => {
            process.env.JWT_SECRET = "";
            const mockPayload: JwtCustomPayload = {
                id: "usr_env_002",
                roles: ["user"],
                iat: 1710000400,
                exp: 1810000400,
            };

            req.headers = {
                authorization: "Bearer tok_env_empty",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_env_empty", "defaultSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });

        it("uses the custom JWT_SECRET from the environment when provided", () => {
            process.env.JWT_SECRET = "S3cr3t_Custom_987";
            const mockPayload: JwtCustomPayload = {
                id: "usr_env_003",
                roles: ["admin"],
                iat: 1710000500,
                exp: 1810000500,
            };

            req.headers = {
                authorization: "Bearer tok_env_custom",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_env_custom", "S3cr3t_Custom_987");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("edge cases and special scenarios", () => {
        it("handles an extremely long token and proceeds if verification succeeds", () => {
            const longToken = "a".repeat(1000);
            req.headers = {
                authorization: `Bearer ${longToken}`,
            };
            const mockPayload: JwtCustomPayload = {
                id: "usr_long_001",
                roles: ["user"],
                iat: 1710000600,
                exp: 1810000600,
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith(longToken, "testSecret");
            expect(next).toHaveBeenCalled();
        });

        it("accepts a token with an empty roles array and calls next()", () => {
            const mockPayload: JwtCustomPayload = {
                id: "usr_empty_roles",
                roles: [],
                iat: 1710000700,
                exp: 1810000700,
            };

            req.headers = {
                authorization: "Bearer tok_no_roles",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_no_roles", "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(req.user?.roles).toHaveLength(0);
            expect(next).toHaveBeenCalled();
        });

        it("accepts a token with multiple roles", () => {
            const mockPayload: JwtCustomPayload = {
                id: "usr_multi_004",
                roles: ["viewer", "editor", "author", "owner"],
                iat: 1710000800,
                exp: 1810000800,
            };

            req.headers = {
                authorization: "Bearer tok_many_roles",
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("tok_many_roles", "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(req.user?.roles).toHaveLength(4);
            expect(next).toHaveBeenCalled();
        });

        it("attempts verification when 'bearer' is lowercase and returns 403 on failure", () => {
            req.headers = {
                authorization: "bearer lower_token_xyz",
            };
            
            const jwtError = new Error("JsonWebTokenError: invalid token");
            jwtError.name = "JsonWebTokenError";
            mockJwtVerify.mockImplementation(() => {
                throw jwtError;
            });

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith("lower_token_xyz", "testSecret");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid token." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("does not modify the request object when token verification fails", () => {
            req.headers = {
                authorization: "Bearer tok_fail_verify",
            };
            const originalReq = { ...req };
            mockJwtVerify.mockImplementation(() => {
                throw new Error("Token verification failed");
            });

            authMiddleware(req as Request, res as Response, next);

            expect(req.user).toBeUndefined();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it("handles a token containing special characters", () => {
            const specialToken =
              "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlhdCI6MTYxNjIzOTAyMn0.DUMMYsignature123";
            req.headers = {
                authorization: `Bearer ${specialToken}`,
            };
            const mockPayload: JwtCustomPayload = {
                id: "usr_special_777",
                roles: ["user"],
                iat: 1710000900,
                exp: 1810000900,
            };
            mockJwtVerify.mockReturnValue(mockPayload);

            authMiddleware(req as Request, res as Response, next);

            expect(jwt.verify).toHaveBeenCalledWith(specialToken, "testSecret");
            expect(req.user).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("response object integration", () => {
        it("supports chained response methods for unauthorized responses", () => {
            req.headers = {};

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
            expect(res.status).toHaveReturnedWith(res); 
        });
        
        it("calls status and json in the correct order for 401 unauthorized", () => {
            req.headers = {};

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No token provided." 
            });
        });

        it("calls status and json in the correct order for 403 invalid token", () => {
            req.headers = {
                authorization: "Bearer tok_wrong_zzz",
            };
            mockJwtVerify.mockImplementation(() => {
                throw new Error("Invalid token");
            });

            authMiddleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Invalid token." 
            });
        });
    });
});
