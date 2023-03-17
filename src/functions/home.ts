import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://samepage.ngrok.io");

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
    .then((r) => r.data.boards.filter((b) => !b.name.startsWith("Sub")));
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
                header: "Home",
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
              { header: "Boards", widgets },
            ],
          },
        },
      ],
    },
  };
};

export default createAPIGatewayProxyHandler(home);
