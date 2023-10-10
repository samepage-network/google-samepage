import createAPIGatewayHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";
import downloadFileContent from "samepage/backend/downloadFileContent";
import uploadFileContent from "samepage/backend/uploadFileContent";
import emailError from "samepage/backend/emailError.server";

const log = async (code: string) => {
  const Key = `data/debugging/google/oauth.json`;
  const data = await downloadFileContent({
    Key,
  }).then((r) => JSON.parse(r));
  data.codes.push({ code, date: new Date().toJSON() });
  await uploadFileContent({ Key, Body: JSON.stringify(data, null, 2) });
};

export const logic = async ({
  ["x-google-client-id"]: clientId,
  ["x-google-client-secret"]: clientSecret,
  ["x-google-redirect-uri"]: redirectUri,
  ...inputArgs
}: {
  requestId: string;
  grant_type: string;
  code: string;
  refresh_token: string;
  scope: string;
  authuser: string;
  prompt: string;
  dev: boolean;
  ["x-google-client-id"]: string;
  ["x-google-client-secret"]: string;
  ["x-google-redirect-uri"]: string;
}) => {
  const {
    scope: _,
    authuser: __,
    prompt: ___,
    requestId,
    dev,
    ...args
  } = inputArgs;
  const tokenArgs = {
    ...args,
    client_id: clientId || process.env.OAUTH_CLIENT_ID,
    client_secret:
      clientSecret ||
      process.env.ROAMJS_GOOGLE_CLIENT_SECRET ||
      process.env.OAUTH_CLIENT_SECRET,
    ...(args.grant_type === "authorization_code"
      ? {
          redirect_uri:
            redirectUri ||
            (process.env.NODE_ENV === "production"
              ? "https://samepage.network/oauth/google?roamjs=true"
              : "https://samepage.ngrok.io/oauth/google?roamjs=true"),
        }
      : {}),
  };
  if (args.grant_type === "authorization_code") {
    await log(args.code).catch((e) =>
      emailError("Failed to log code", e as Error)
    );
  }
  const { data } = await axios
    .post<{ access_token: string }>(
      "https://oauth2.googleapis.com/token",
      tokenArgs
    )
    .catch((e) =>
      Promise.reject(
        new Error(
          `Failed to fetch google token:\n${JSON.stringify(
            e.response.data
          )}\nToken args:\n${JSON.stringify(tokenArgs)}`
        )
      )
    );
  if (args.grant_type === "authorization_code") {
    return axios
      .get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${data.access_token}`
      )
      .then((u) => ({ ...data, label: u.data.email }))
      .catch((e) =>
        Promise.reject(
          new Error(
            `Failed to fetch userinfo: ${JSON.stringify(e.response.data)}`
          )
        )
      );
  }
  return data;
};

export default createAPIGatewayHandler({
  logic,
  includeHeaders: [
    "x-google-client-id",
    "x-google-client-secret",
    "x-google-redirect-uri",
  ],
  allowedOrigins: [/.*/],
});
