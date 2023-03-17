import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://samepage.ngrok.io");

/** Creates a card with two widgets. */
const home = async () => {
  const boards = await axios
    .post<{
      boards: {
        id: string;
        name: string;
      }[][];
    }>(`${API_URL}/extensions/monday/query`)
    .then((r) => r.data.boards);
  console.log("boards", boards);
  const sections = boards.map((card, index) => ({
    header: `Board ${index + 1}`,
    widgets: card.map((item) => ({
      textParagraph: {
        text: `Item: ${item.name} (${item.id})`,
      },
    })),
  }));
  return {
    action: {
      navigations: [
        {
          pushCard: {
            header: {
              title: "Monday Boards",
            },
            sections,
          },
        },
      ],
    },
  };
};

export default createAPIGatewayProxyHandler(home);
