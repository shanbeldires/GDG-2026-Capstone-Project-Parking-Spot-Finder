import Joi from "joi";

const userValidationSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .min(3)
        .max(20)
        .required()
        .messages({
            "string.empty": "full name is required",
            "string.min": "full name must be at least 3 characters",
            "string.max": "full name must be at most 20 characters"
        }),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .min(5)
        .required()
        .messages({
            "string.empty": "email is required",
            "string.email": "email is invalid",
            "string.min": "email must be at least 5 characters"
        }),

    password: Joi.string()
        .trim()
        .min(8)
        .required()
        .messages({
            "string.empty": "password is required",
            "string.min": "password must be at least 8 characters"
        }),

    role: Joi.string()
        .trim()
        .lowercase()
        .valid("user", "admin")
        .default("user")
});

export default userValidationSchema;