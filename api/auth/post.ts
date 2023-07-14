import createAPIGatewayHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Credentials": true,
};

export const logic = async ({
  ["x-google-client-id"]: clientId,
  ["x-google-client-secret"]: clientSecret,
  ["x-google-redirect-uri"]: redirectUri,
  ...inputArgs
}: {
  grant_type: string;
  code: string;
  refresh_token: string;
  scope: string;
  authuser: string;
  prompt: string;
  ["x-google-client-id"]: string;
  ["x-google-client-secret"]: string;
  ["x-google-redirect-uri"]: string;
}) => {
  const { scope: _, authuser: __, prompt: ___, ...args } = inputArgs;
  const tokenArgs = {
    ...args,
    client_id: clientId || process.env.OAUTH_CLIENT_ID,
    client_secret: clientSecret || process.env.OAUTH_CLIENT_SECRET,
    redirect_uri:
      redirectUri ||
      (process.env.NODE_ENV === "production"
        ? "https://samepage.network/oauth/google"
        : "https://samepage.ngrok.io/oauth/google"),
  };
  const { data: _data } = await axios
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
  const data = { ..._data, headers };
  if (args.grant_type === "authorization_code")
    return axios
      .get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${data.access_token}`
      )
      .then((u) => ({ ...data, label: u.data.email, headers }))
      .catch((e) =>
        Promise.reject(
          new Error(
            `Failed to fetch userinfo: ${JSON.stringify(e.response.data)}`
          )
        )
      );
  return data;
};

export default createAPIGatewayHandler({
  logic,
  includeHeaders: [
    "x-google-client-id",
    "x-google-client-secret",
    "x-google-redirect-uri",
  ],
});
