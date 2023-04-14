import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import getNotebookCredentials from "samepage/backend/getNotebookCredentials";
import { oauth2_v2 } from "@googleapis/oauth2";
import { z } from "zod";
import getHomeCard from "src/cards/getHomeCard";

const emailWidget = (value?: string | null) => ({
  textInput: {
    name: "email",
    label: "Email",
    value,
  },
});
const passwordWidget = {
  textInput: {
    name: "password",
    label: "Password",
  },
};

const zGoogleHomeArgs = z.object({
  authorizationEventObject: z.object({
    userOAuthToken: z.string(),
  }),
});

const home = async (args: unknown) => {
  const oauth_token =
    zGoogleHomeArgs.parse(args).authorizationEventObject.userOAuthToken;
  const googleClient = new oauth2_v2.Oauth2({});
  const { email, hd } = await googleClient.userinfo
    .get({
      oauth_token,
    })
    .then((r) => {
      return r.data;
    });
  const result = await getNotebookCredentials({
    email: email || "",
    app: "google",
    workspace: hd || "",
  })
    .then((data) => ({ success: true as const, data }))
    .catch((e) => {
      if (e.code === 404) {
        return { success: false as const, data: { login: true } };
      } else if (e.code === 401) {
        return { success: false as const, data: { login: false } };
      }
      return Promise.reject(e);
    });
  return {
    action: {
      navigations: [
        {
          pushCard: {
            header: {
              title: "Welcome to Samepage",
            },
            sections: [
              {
                header: `Home`,
                widgets: result.success
                  ? await getHomeCard(result.data)
                  : result.data.login
                  ? [
                      {
                        textParagraph: {
                          text: "Enter your Samepage credentials to get started!",
                        },
                      },
                      emailWidget(email),
                      passwordWidget,
                      {
                        buttonList: {
                          buttons: [
                            {
                              text: "Log In",
                              color: {
                                red: 0,
                                green: 0,
                                blue: 1,
                                alpha: 1,
                              },
                              onClick: {
                                action: {
                                  function:
                                    "https://api.samepage.ngrok.io/extensions/google/login",
                                },
                              },
                            },
                          ],
                        },
                      },
                    ]
                  : [
                      {
                        textParagraph: {
                          text: "Create your Samepage credentials to get started!",
                        },
                      },
                      emailWidget(email),
                      passwordWidget,
                      {
                        buttonList: {
                          buttons: [
                            {
                              text: "Sign Up",
                              color: {
                                red: 0,
                                green: 0,
                                blue: 1,
                                alpha: 1,
                              },
                              onClick: {
                                action: {
                                  function:
                                    "https://api.samepage.ngrok.io/extensions/google/signup",
                                },
                              },
                            },
                          ],
                        },
                      },
                    ],
              },
            ],
          },
        },
      ],
    },
  };
};

export default createAPIGatewayProxyHandler(home);
