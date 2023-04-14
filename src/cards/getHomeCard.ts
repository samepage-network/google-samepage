import axios from "axios";

const API_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.samepage.network"
    : "https://api.samepage.ngrok.io");

const getHomeCard = async (_notebook: { uuid: string; token: string }) => {
  //   get all the live requests this notebook has access to
  //   const liveRequests = await getLiveRequests(notebook);
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
    .catch((e) => {
      console.error("Monday API error", e.response.data);
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
  return [{ header: "Boards", widgets }];
};

export default getHomeCard;
