import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { handleValidationErrors } from "../../middlewares/handle.middleware"; 


jest.mock("express-validator", () => ({
    validationResult: jest.fn(),
}));

describe("HandleValidationErrors Middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let mockValidationResult: jest.Mock;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
        mockValidationResult = validationResult as unknown as jest.Mock;
        
        jest.clearAllMocks();
    });

    describe("field validation errors", () => {
        it("should handle single field error", () => {
            const singleError = [
                {
                    type: "field",
                    path: "nickname",
                    msg: "Nickname is required",
                    value: null
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(singleError)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "nickname",
                        message: "Nickname is required",
                        value: null
                    }
                ]
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 400 and formats multiple field errors", () => {
            const fieldErrors = [
                {
                    type: "field",
                    path: "email",
                    msg: "Email cannot be empty",
                    value: ""
                },
                {
                    type: "field", 
                    path: "password",
                    msg: "Password must be at least 8 characters",
                    value: "12345"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(fieldErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(validationResult).toHaveBeenCalledWith(req);
            expect(mockErrors.isEmpty).toHaveBeenCalled();
            expect(mockErrors.array).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "email",
                        message: "Email cannot be empty",
                        value: ""
                    },
                    {
                        field: "password",
                        message: "Password must be at least 8 characters",
                        value: "12345"
                    }
                ]
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("handle field errors with complex object values", () => {
            const complexErrors = [
                {
                    type: "field",
                    path: "address",
                    msg: "Address format is invalid",
                    value: { street: "742 Evergreen Terrace", city: "" }
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(complexErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "address",
                        message: "Address format is invalid",
                        value: { street: "742 Evergreen Terrace", city: "" }
                    }
                ]
            });
        });

        it("handle field errors with undefined values", () => {
            const errorsWithUndefined = [
                {
                    type: "field",
                    path: "age",
                    msg: "Age must be an integer",
                    value: undefined
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(errorsWithUndefined)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "age",
                        message: "Age must be an integer",
                        value: undefined
                    }
                ]
            });
        });
    });

    describe("successful validation", () => {
        it("calls next() when validation passes with no errors", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([])
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(validationResult).toHaveBeenCalledWith(req);
            expect(mockErrors.isEmpty).toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it("does not call errors.array() when validation passes", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn()
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(mockErrors.isEmpty).toHaveBeenCalled();
            expect(mockErrors.array).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
        });
    }); 
    
    describe("non-field validation errors", () => {
        it("returns 400 and maps non-field errors to an 'unknown' field", () => {
            const nonFieldErrors = [
                {
                    type: "alternative",
                    msg: "Either email or mobile number is required",
                    nestedErrors: []
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(nonFieldErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "unknown",
                        message: "Either email or mobile number is required",
                        value: undefined
                    }
                ]
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("returns 400 and formats mixed field and non-field errors", () => {
            const mixedErrors = [
                {
                    type: "field",
                    path: "email",
                    msg: "Email is not valid",
                    value: "invalid-email"
                },
                {
                    type: "alternative_grouped",
                    msg: "Password confirmation mismatch"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(mixedErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "email",
                        message: "Email is not valid",
                        value: "invalid-email"
                    },
                    {
                        field: "unknown",
                        message: "Password confirmation mismatch",
                        value: undefined
                    }
                ]
            });
        });
    });

    describe("validationResult integration", () => {
        it("invokes validationResult with the correct request object", () => {
            const specificReq = { 
                body: { email: "john@doe.dev" },
                params: { id: "A-77" }
            } as Partial<Request>;
            
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn()
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(specificReq as Request, res as Response, next);

            expect(validationResult).toHaveBeenCalledWith(specificReq);
            expect(validationResult).toHaveBeenCalledTimes(1);
        });

        it("throws when validationResult itself throws", () => {
            mockValidationResult.mockImplementation(() => {
                throw new Error("validationResult internal failure");
            });

            expect(() => {
                handleValidationErrors(req as Request, res as Response, next);
            }).toThrow("validationResult internal failure");
            
            expect(next).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("handle when isEmpty method throws an error", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockImplementation(() => {
                    throw new Error("isEmpty failed");
                }),
                array: jest.fn()
            };
            mockValidationResult.mockReturnValue(mockErrors);

            expect(() => {
                handleValidationErrors(req as Request, res as Response, next);
            }).toThrow("isEmpty failed");
        });

        it("handle when array method throws an error", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockImplementation(() => {
                    throw new Error("errors.array failed");
                })
            };
            mockValidationResult.mockReturnValue(mockErrors);

            expect(() => {
                handleValidationErrors(req as Request, res as Response, next);
            }).toThrow("errors.array failed");
        });
    });

    describe("response object integration", () => {
        it("calls status and json in the correct sequence for 400 responses", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{
                    type: "field",
                    path: "code",
                    msg: "Sample validation error",
                    value: "foo"
                }])
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "code",
                        message: "Sample validation error",
                        value: "foo"
                    }
                ]
            });
        });

        it("supports response chaining (status -> json) for 400 responses", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([])
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: []
            });
            expect(res.status).toHaveReturnedWith(res); 
        });
    });    
    
    describe("edge cases and special scenarios", () => {
        it("handle empty error array", () => {
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([])
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: []
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("handle errors with missing msg property", () => {
            const errorsWithoutMsg = [
                {
                    type: "field",
                    path: "title",
                    value: "hello"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(errorsWithoutMsg)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "title",
                        message: undefined,
                        value: "hello"
                    }
                ]
            });
        });

        it("handles field errors missing the path property", () => {
            const errorsWithoutPath = [
                {
                    type: "field",
                    msg: "Validation failed",
                    value: "oops"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(errorsWithoutPath)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: undefined,
                        message: "Validation failed",
                        value: "oops"
                    }
                ]
            });
        });

        it("handles errors missing the type property", () => {
            const errorsWithoutType = [
                {
                    path: "email",
                    msg: "Email check failed",
                    value: "bad@"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(errorsWithoutType)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "unknown",
                        message: "Email check failed",
                        value: undefined
                    }
                ]
            });
        });

        it("handles a large number of validation errors", () => {
            const manyErrors = Array.from({ length: 50 }, (_, i) => ({
                type: "field",
                path: `field${i}`,
                msg: `Invalid value for key ${i}`,
                value: `val_${i}`
            }));

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(manyErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: expect.stringMatching(/field\d+/),
                        message: expect.stringMatching(/Invalid value for key \d+/),
                        value: expect.stringMatching(/val_\d+/)
                    })
                ])
            });
            
            const responseCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseCall.errors).toHaveLength(50);
            expect(next).not.toHaveBeenCalled();
        });

        it("preserves special characters in error messages", () => {
            const specialCharErrors = [
                {
                    type: "field",
                    path: "description",
                    msg: "Field contains invalid characters: ~!^[]{}<>",
                    value: "weird~!^[]{}"
                }
            ];

            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(specialCharErrors)
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                message: "Validation errors",
                errors: [
                    {
                        field: "description",
                        message: "Field contains invalid characters: ~!^[]{}<>",
                        value: "weird~!^[]{}"
                    }
                ]
            });
        });

        it("does not mutate the original request object", () => {
            const originalReq = { ...req };
            const mockErrors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([{
                    type: "field",
                    path: "test",
                    msg: "Test error",
                    value: "test"
                }])
            };
            mockValidationResult.mockReturnValue(mockErrors);

            handleValidationErrors(req as Request, res as Response, next);

            expect(req).toEqual(originalReq);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
