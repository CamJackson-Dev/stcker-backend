// @ts-ignore
import paypal from "@paypal/checkout-server-sdk";
import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from "../../config";

const createEnvironment = () => {
  return new paypal.core.SandboxEnvironment(
    PAYPAL_CLIENT_ID,
    PAYPAL_CLIENT_SECRET
  );
};

export const createPaypalClient = () => {
  return new paypal.core.PayPalHttpClient(createEnvironment());
};

const capitalize = (string: string) => {
  return string[0].toLocaleUpperCase() + string.slice(1).toLowerCase();
};

export const prettyPrint = async (jsonData: Record<any, any>, pre = "") => {
  let pretty = "";

  for (let key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      if (isNaN(key as any)) pretty += pre + capitalize(key) + ": ";
      else pretty += pre + (parseInt(key) + 1) + ": ";
      if (typeof jsonData[key] === "object") {
        pretty += "\n";
        pretty += await prettyPrint(jsonData[key], pre + "    ");
      } else {
        pretty += jsonData[key] + "\n";
      }
    }
  }
  return pretty;
};
