import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";
import { oauth2_v2 } from "@googleapis/oauth2";
import { admin_directory_v1 } from "@googleapis/admin";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://api.samepage.ngrok.io");

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
  const client = new oauth2_v2.Oauth2({});
  const { email, hd } = await client.userinfo
    .get({
      oauth_token,
    })
    .then((r) => {
      return r.data;
    });
  const workspace = hd || email;
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
                header: `${workspace} Home`,
                widgets: [
                  {
                    textParagraph: {
                      text: "You're about to connect your notebook to SamePage - the inter-app collaboration network.",
                    },
                  },
                  {
                    textParagraph: {
                      text: "We're excited to have you!",
                    },
                  },
                  {
                    buttonList: {
                      buttons: [
                        {
                          text: "Setup",
                          color: {
                            red: 0,
                            green: 0,
                            blue: 1,
                            alpha: 1,
                          },
                          onClick: {
                            card: {
                              header: {
                                title: "Setup Samepage",
                              },
                              sections: [
                                {
                                  header: "New to SamePage?",
                                  widgets: [
                                    {
                                      textParagraph: {
                                        text: "You're about to connect your notebook to SamePage - the inter-app collaboration network.",
                                      },
                                      // buttonList: {
                                      //     buttons: [],
                                      // }
                                    },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ].concat(widgets.length ? { header: "Boards", widgets } : []),
          },
        },
      ],
    },
  };
};

export default createAPIGatewayProxyHandler(home);
