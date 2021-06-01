import FastestValidator, { ValidationSchema } from "fastest-validator";

const validator = new FastestValidator();

export const getValidationErrors = (
  value: any,
  schema: ValidationSchema<any>
) => {
  const formattedErrors: Record<string, string> = {};

  const validationErrors = validator.validate(value, schema);

  if (validationErrors === true) return null;

  validationErrors.forEach((error) => {
    const key = error.field;
    formattedErrors[key] = error.message!;
  });

  return formattedErrors;
};

export const editProfileSchema = {
  email: generateEmailSchema(),
  firstname: generateNameSchema("Firstname"),
  lastname: generateNameSchema("Lastname"),
};

export const changePasswordSchema = {
  password: generatePasswordSchema(),
  newPassword: generatePasswordSchema(),
};

export const loginSchema = {
  email: generateEmailSchema(),
  password: generatePasswordSchema(),
};

export const registerSchema = {
  ...loginSchema,
  firstname: generateNameSchema("Firstname"),
  lastname: generateNameSchema("Lastname"),
};

export const requestSchema = {
  email: generateEmailSchema(),
  subject: {
    type: "string",
    trim: true,
    max: 255,
    empty: false,
    messages: {
      required: "Subject is required",
      stringEmpty: "Subject is required",
      stringMax: "Subject should not be more than 255 characters",
    },
  },
  message: {
    type: "string",
    trim: true,
    max: 1024,
    empty: false,
    messages: {
      required: "Message is required",
      stringEmpty: "Message is required",
      stringMax: "Message should not be more than 1024 characters",
    },
  },
};

function generateNameSchema(field: string) {
  return {
    type: "string",
    empty: false,
    max: 50,
    trim: true,
    pattern: /^[a-z ,.'-]+$/i,
    messages: {
      required: `${field} is required`,
      stringEmpty: `${field} is required`,
      stringMax: `${field} should not be more than 50 characters`,
      stringPattern: `${field} should contain letters or ,.'-`,
    },
  };
}

function generateEmailSchema() {
  return {
    type: "email",
    normalize: true,
    trim: true,
    max: 255,
    messages: {
      email: "Email is not a valid email address",
      required: "Email is not a valid email address",
      emailMax: "Email should not be more than 255 characters",
    },
  };
}

function generatePasswordSchema() {
  return {
    type: "string",
    min: 12,
    messages: {
      stringMin: "Password should not be up to 12 characters",
      required: "Password should not be up to 12 characters",
    },
  };
}
