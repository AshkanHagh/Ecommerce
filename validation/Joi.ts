import Joi, { string } from 'joi';

const validator = (schema : Joi.Schema) => (payload : object) => schema.validate(payload, {abortEarly : false});

const registerSchema = Joi.object({
    fullName : Joi.string().required(),
    email : Joi.string().email().required(),
    password : Joi.string().min(6).required(),
    profilePic : Joi.string(),
    birthDay : Joi.date()
    // confirmPassword : Joi.ref('password'),
});

export const validateRegister = validator(registerSchema);

const loginSchema = Joi.object({
    email : Joi.string().email().required(),
    password : Joi.string().min(6).required(),
});

export const validateLogin = validator(loginSchema);

const accountInfoSchema = Joi.object({
    fullName : Joi.string(),
    email : Joi.string().email(),
    birthDay : Joi.date()
});

export const validateAccountInfo = validator(accountInfoSchema);

const accountPasswordSchema = Joi.object({
    oldPassword : Joi.string().min(6).required(),
    newPassword : Joi.string().min(6).required()
});

export const validateAccountPassword = validator(accountPasswordSchema);

const accountAddressSchema = Joi.object({
    addressLine1 : Joi.string(), 
    addressLine2 : Joi.string(), 
    city : Joi.string(), 
    state : Joi.string(), 
    country : Joi.string(), 
    postalCode : Joi.string()
});

export const validateAddress = validator(accountAddressSchema);

const accountProfileSchema = Joi.object({
    profilePic : Joi.string().required()
});

export const validateProfile = validator(accountProfileSchema);

const addProductSchema = Joi.object({
    name : Joi.string().required(),
    price : Joi.number().required(),
    description : Joi.string().required(),
    images : Joi.array(),
    category : Joi.array(),
    color : Joi.array(),
    size : Joi.array(),
    availableQuantity : Joi.number().required()
});

export const validateAddProduct = validator(addProductSchema);

const updateProductSchema = Joi.object({
    name : Joi.string().required(),
    price : Joi.number().required(),
    description : Joi.string().required(),
    images : Joi.array(),
    category : Joi.array(),
    color : Joi.array(),
    size : Joi.array(),
    availableQuantity : Joi.number().required()
});

export const validateUpdateProduct = validator(updateProductSchema);

const commentSchema = Joi.object({
    text : Joi.string().required()
});

export const validateComment = validator(commentSchema);

const roleRequestSchema = Joi.object({
    message : Joi.string().required(),
    requestedRole : Joi.string().required()
});

export const validateRoleBody = validator(roleRequestSchema);