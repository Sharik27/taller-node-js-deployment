import { Request, Response, NextFunction } from "express";
import { checkRole } from "../../middlewares/preAuthorize.middleware"; 
import { UserRole } from "../../models";

describe("CheckRole Middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        
        jest.clearAllMocks();
    });

    describe("successful role authorization", () => {
        it("calls next() when user has the required USER role", () => {
            req.user = {
                id: "u-456x",
                email: "member@sample.io",
                roles: [UserRole.USER]
            };

            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it("calls next() when user has the required ADMIN role", () => {
            req.user = {
                id: "a-123x",
                email: "root@sample.io",
                roles: [UserRole.ADMIN, UserRole.USER]
            };

            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it("calls next() when user has multiple roles including the required one", () => {
            req.user = {
                id: "u-789x",
                email: "su@sample.io",
                roles: [UserRole.ADMIN, UserRole.USER]
            };

            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe("access denied - missing user", () => {

        it("returns 403 when user is null", () => {
            req.user = null as any;
            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when user is undefined", () => {
            delete req.user;
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when user is missing from the request", () => {
            delete req.user;
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("access denied - missing or invalid roles", () => {
        it("returns 403 when user.roles is null", () => {
            req.user = {
                id: "u-001",
                email: "person@sample.io",
                roles: null as any
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when user.roles is undefined", () => {
            req.user = {
                id: "u-002",
                email: "member@domain.dev",
                roles: undefined as any
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });
        
        it("returns 403 when user.roles is an empty array", () => {
            req.user = {
                id: "u-empty",
                email: "no.roles@nowhere.tld",
                roles: []
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when user.roles is not an array", () => {
            req.user = {
                id: "u-notarr",
                email: "weird@roles.tld",
                roles: "admin" as any
            };
            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("access denied - insufficient permissions", () => {
        it("returns 403 when the user lacks the required role", () => {
            req.user = {
                id: "u-456",
                email: "basic@sample.io",
                roles: [UserRole.USER]
            };
            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when USER is present but ADMIN is required", () => {
            req.user = {
                id: "u-123",
                email: "justuser@sample.io",
                roles: [UserRole.USER]
            };
            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied." 
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 403 when user has invalid role values", () => {
            req.user = {
                id: "u-789",
                email: "odd@sample.io",
                roles: ["bad_role" as UserRole]
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied." 
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("middleware factory behavior", () => {
        it("creates  distinct middleware instances per required role", () => {
            const adminMiddleware = checkRole(UserRole.ADMIN);
            const userMiddleware = checkRole(UserRole.USER);

            expect(adminMiddleware).not.toBe(userMiddleware);
            expect(typeof adminMiddleware).toBe("function");
            expect(typeof userMiddleware).toBe("function");
        });

        it("returns a function that accepts req, res, next parameters", () => {
            const middleware = checkRole(UserRole.USER);

            expect(typeof middleware).toBe("function");
            expect(middleware.length).toBe(3); 
        });

        it("preserves the required role across multiple invocations", () => {
            const middleware = checkRole(UserRole.ADMIN);
            
            req.user = { 
                id: "root-1", 
                roles: [UserRole.ADMIN] 
            };

            middleware(req as Request, res as Response, next);
            expect(next).toHaveBeenCalledTimes(1);

            jest.clearAllMocks();
            req.user = { 
                id: "guest-1", 
                roles: [UserRole.USER] 
            };

            middleware(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });    
    
    describe("edge cases and special scenarios", () => {
        it("handles duplicate entries within the roles array", () => {
            req.user = {
                id: "u-dup",
                email: "dupe@sample.io",
                roles: [UserRole.USER, UserRole.USER, UserRole.ADMIN]
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("ignores extra properties on the user object", () => {
            req.user = {
                id: "u-extra",
                email: "prop@sample.io",
                roles: [UserRole.ADMIN],
                name: "Casey Tester",
                createdAt: new Date(),
                extraProperty: "ignored"
            } as any;
            const middleware = checkRole(UserRole.ADMIN);

            middleware(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should not modify the original request object", () => {
            const originalUser = {
                id: "u-orig",
                email: "orig@sample.io",
                roles: [UserRole.USER]
            };
            req.user = { ...originalUser };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(req.user).toEqual(originalUser);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("different role types testing", () => {
        it("authorizes correctly for each UserRole enum value", () => {
            const testCases = [
                { role: UserRole.ADMIN, userRoles: [UserRole.ADMIN] },
                { role: UserRole.USER, userRoles: [UserRole.USER] }
            ];

            testCases.forEach(({ role, userRoles }) => {
                jest.clearAllMocks();
                
                req.user = {
                    id: `acc-${role}`,
                    email: `${role}@roles.dev`,
                    roles: userRoles
                };

                const middleware = checkRole(role);

                middleware(req as Request, res as Response, next);

                expect(next).toHaveBeenCalled();
                expect(res.status).not.toHaveBeenCalled();
            });
        });

        it("should correctly differentiate between similar role names", () => {
            req.user = {
                id: "u-mix",
                email: "mix@roles.dev",
                roles: [UserRole.USER]
            };

            const adminMiddleware = checkRole(UserRole.ADMIN);
            const userMiddleware = checkRole(UserRole.USER);

            adminMiddleware(req as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();

            jest.clearAllMocks();

            userMiddleware(req as Request, res as Response, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("response object integration", () => {

        it("supports response chaining for access-denied responses", () => {
            req.user = {
                id: "u-none",
                roles: []
            };
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied." 
            });
            expect(res.status).toHaveReturnedWith(res); 
        });
        
        it("calls status and json methods in correct sequence for missing roles", () => {
            delete req.user;
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ 
                message: "Access denied. No roles found." 
            });
        });

        it("returns a Response from res.status and prevents next() on denial", () => {
            delete req.user;
            const middleware = checkRole(UserRole.USER);

            middleware(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
