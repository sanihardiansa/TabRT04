import Joi from 'joi';

export const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),

  register: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d\-\+\s]+$/).max(15),
    address: Joi.string().max(255),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character',
      }),
  }),

  // Member schemas
  createMember: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\d\-\+\s]+$/).max(15),
    address: Joi.string().max(255),
    memberNumber: Joi.string().max(50),
  }),

  updateMember: Joi.object({
    name: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[\d\-\+\s]+$/),
    address: Joi.string().max(255),
  }),

  // Deposit schemas
  createDeposit: Joi.object({
    memberId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(255),
  }),

  // Withdrawal schemas
  createWithdrawal: Joi.object({
    memberId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    reason: Joi.string().max(255).required(),
  }),

  approveWithdrawal: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
  }),
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    req.validatedData = value;
    next();
  };
};
