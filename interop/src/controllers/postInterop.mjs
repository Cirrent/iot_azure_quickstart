import Joi from "joi";

import requestMiddleware from "../middleware/request.mjs";
import { getSerialNumber, getCertificate } from "../helpers/crypto.mjs";
import { baseTopic } from "../vars.mjs";

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
  const { action } = req.body;
  let resp;

  switch (action) {
    case "provision": {
      const { certs } = req.body;

      resp = await provision(certs);
      break;
    }
    case "message": {
      resp = await message();
      break;
    }
    case "status": {
      resp = await status();
      break;
    }
  }

  res.send(resp);
}

async function status() {
  return {
    message: "Not yet implemented.",
    action: "status",
  };
}

async function message() {
  return {
    message: "Not yet implemented.",
    action: "message",
  };
}

async function provision(certs) {
  let resp = [];

  const endpoint = "1";
  const policy = "1";

  for (const item of certs) {
    let certBuf;
    let cert;
    let serialNumber;

    try {
      certBuf = Buffer.from(item.cert, "base64");
      cert = await getCertificate(certBuf);
    } catch (err) {
      resp.push({
        ref: item.ref,
        status: "ERROR",
        message: "Cannot decode certitifcate",
      });
      continue;
    }

    try {
      serialNumber = await getSerialNumber(cert);
      console.log(serialNumber);
    } catch (err) {
      console.log("errserial:", err);
      resp.push({
        ref: item.ref,
        status: "ERROR",
        message:
          "Certificate serial cannot be decoded or is incorrect (only alphanumeric/hyphen/underscore)",
      });
      continue;
    }

    try {
      resp.push({
        ref: item.ref,
        status: "SUCCESS",
        endpoint: endpoint,
        topic: baseTopic,
        policyApplied: policy,
      });
    } catch (err) {
      resp.push({
        ref: item.ref,
        status: "ERROR",
        message: "Failed creating and registering thing",
      });
      continue;
    }
  }

  return resp;
}

export default requestMiddleware(post, {
  validation: { body: postInteropSchema },
});
