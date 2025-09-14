import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares';

export const reservationValidations = {
    create: [

        body('date')
            .isISO8601()
            .withMessage('Date must be a valid date'),

        body('hour')
            .trim()
            .isLength({ min: 1, max: 20 })
            .withMessage('Hour must be between 1 and 20 characters')
            .matches(/^(0[1-9]|1[0-2]):[0-5][0-9](AM|PM)$/)
            .withMessage('Please provide a valid hour'),

        body('userQuantity')
            .isInt({ gt: 1 })
            .withMessage('User quantity must be greater than 1')
            .toInt(),

            
        body('status')
            .trim()
            .isLength({ min: 1, max: 15 })
            .withMessage('Status must be between 1 and 15 characters'),

        handleValidationErrors
    ],

    update: [

        body('date')
            .isISO8601()
            .withMessage('Date must be a valid date')
            .optional(),
        
        body('hour')
            .trim()
            .isLength({ min: 1, max: 20 })
            .withMessage('Hour must be between 1 and 20 characters')
            .matches(/^(0[1-9]|1[0-2]):[0-5][0-9](AM|PM)$/)
            .withMessage('Please provide a valid hour')
            .optional(),
        
        body('userQuantity')
            .optional()
            .isInt({ gt: 1 })
            .withMessage('User quantity must be greater than 1')
            .toInt(),
            
        body('status')
            .trim()
            .isLength({ min: 1, max: 15 })
            .withMessage('Status must be between 1 and 15 characters')
            .optional(),

        handleValidationErrors
    ],

    id: [
        param('id')
            .isMongoId()
            .withMessage('Invalid game ID format'),

        handleValidationErrors
    ],

    userId: [
        param('userId')
            .isMongoId()
            .withMessage('Invalid user ID format'),

        handleValidationErrors
    ],

    restaurantId: [
        param('restaurantId')
            .isMongoId()
            .withMessage('Invalid restaurant ID format'),

        handleValidationErrors
    ]


};
