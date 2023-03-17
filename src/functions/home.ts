import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import axios from "axios";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://samepage.ngrok.io");

const home = async () => {
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
  const sections = boards.map((card) => ({
    header: card.name,
    widgets: card.items.map(({ name, id, column_values }) => ({
      textParagraph: {
        text: `Item: ${name} (${id})\n${column_values
          .map((vc) => `    ${vc.title}: ${vc.text}`)
          .join("\n")}`,
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
