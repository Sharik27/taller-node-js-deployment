import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middlewares';

export const restaurantValidations = {
    create: [
        body('name')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Name must be between 1 and 30 characters'),

        body('address')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Address must be between 1 and 30 characters'),

        body('city')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('City must be between 1 and 30 characters'),

        body('nit')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Genre must be between 1 and 30 characters'),

        body('phone')
            .trim()
            .isLength({ min: 1, max: 12 })
            .withMessage('Phone must be between 1 and 12 characters'), 

        handleValidationErrors
    ],

    update: [
        body('name')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Name must be between 1 and 30 characters')
            .optional(),

        body('address')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Address must be between 1 and 30 characters')
            .optional(),

        body('city')
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('City must be between 1 and 30 characters')
            .optional(),

        body('phone')
            .trim()
            .isLength({ min: 1, max: 12 })
            .withMessage('Phone must be between 1 and 12 characters')
            .optional(), 

        handleValidationErrors
    ],

    id: [
        param('id')
            .isMongoId()
            .withMessage('Invalid game ID format'),

        handleValidationErrors
    ],
};
