import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import getNotebookCredentials from "samepage/backend/getNotebookCredentials";
import axios from "axios";
import { oauth2_v2 } from "@googleapis/oauth2";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://api.samepage.ngrok.io");

const emailWidget = {
  textInput: {
    name: "email",
    label: "Email",
  },
};
const passwordWidget = {
  textInput: {
    name: "password",
    label: "Password",
  },
};

const home = async (args: any) => {
  const boards = await axios
    .post<{
      boards: {
        name: string;
        items: {
          id: string;
          name: string;
          column_values: { text: string; title: string }[];
        }[];
      }[];
    }>(`${API_URL}/extensions/monday/query`)
    .then((r) => r.data.boards.filter((b) => !b.name.startsWith("Sub")))
    .catch(() => {
      return [];
    });
  const widgets = boards.map((card) => ({
    buttonList: {
      buttons: [
        {
          text: `View ${card.name}`,
          color: {
            red: 0,
            green: 0,
            blue: 1,
            alpha: 1,
          },
          onClick: {
            card: {
              header: {
                title: `Board: ${card.name}`,
              },
              sections: [
                {
                  header: "Items",
                  widgets: card.items.map(({ name, id, column_values }) => ({
                    textParagraph: {
                      text: `Item: ${name} (${id})\n${column_values
                        .map((vc) => `    ${vc.title}: ${vc.text}`)
                        .join("\n")}`,
                    },
                  })),
                },
              ],
            },
          },
        },
      ],
    },
  }));
  const oauth_token = args.authorizationEventObject.userOAuthToken;
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
      // return Promise.reject(e); TODO
      return { success: false as const, data: { login: true } };
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
                  ? [{ header: "Boards", widgets }]
                  : result.data.login
                  ? [
                      {
                        textParagraph: {
                          text: "Enter your Samepage credentials to get started!",
                        },
                      },
                      emailWidget,
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
                      emailWidget,
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
