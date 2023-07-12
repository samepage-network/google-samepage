import createAPIGatewayHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";

export const logic = async (args: {
  grant_type: string;
  code: string;
  refresh_token: string;
  ["x-google-client-id"]: string;
  ["x-google-client-secret"]: string;
  ["x-google-redirect-uri"]: string;
}) => {
  const { data } = await axios
    .post<{ access_token: string }>("https://oauth2.googleapis.com/token", {
      refresh_token: args.refresh_token,
      code: args.code,
      grant_type: args.grant_type,
      client_id: args["x-google-client-id"] || process.env.OAUTH_CLIENT_ID,
      client_secret:
        args["x-google-client-secret"] || process.env.OAUTH_CLIENT_SECRET,
      redirect_uri:
        args["x-google-redirect-uri"] ||
        (process.env.NODE_ENV === "production"
          ? "https://samepage.network/oauth/google"
          : "https://samepage.ngrok.io/oauth/google"),
    })
    .catch((e) =>
      Promise.reject(
        new Error(
          `Failed to fetch google token: ${JSON.stringify(e.response.data)}`
        )
      )
    );
  if (args.grant_type === "authorization_code")
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
