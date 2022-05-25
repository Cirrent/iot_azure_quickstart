import Joi from "joi";

import requestMiddleware from "../middleware/request.mjs";
import httpStatus from "http-status";

const postInteropSchema = Joi.object().keys({
  action: Joi.string().valid("status", "provision", "message").required(),
  certs: Joi.when("action", {
    is: "provision",
    then: Joi.array().items(
      Joi.object().keys({
        ref: Joi.string().required(),
        cert: Joi.string().base64().required(),
      })
    ),
  }),
});

async function post(req, res, next) {
  res.sendStatus(httpStatus.OK);
}

export default requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
