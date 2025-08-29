import { validationResult } from "express-validator";

export default function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    error: {
      code: "BAD_REQUEST",
      message: "Validation failed",
      details: errors.array().map(e => ({
        param: e.param,
        msg: e.msg,
        location: e.location,
        value: e.value,
      })),
    },
  });
}
