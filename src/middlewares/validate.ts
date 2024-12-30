import Joi from "joi";
import { Request, Response, NextFunction } from "express";

import pick from "@utils/pick";
import ApiError from "@utils/ApiError";

interface Schema {
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  body?: Joi.ObjectSchema;
}

const validate =
  (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: "key" }, abortEarly: false })
      .validate(object);

    if (error) {
      const errorMessage = error.details
        .map((details) => details.message)
        .join(", ");
      return next(new ApiError(400, errorMessage));
    }
    Object.assign(req, value);
    return next();
  };

export default validate;
