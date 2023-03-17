import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import { Lambda } from "@aws-sdk/client-lambda";

const lambda = new Lambda({});

/** Creates a card with two widgets. */
const home = async () => {
  const invokeLambda = await lambda.invoke({
    FunctionName: "samepage-network_extensions-monday-query_post",
    Payload: Buffer.from(JSON.stringify({})),
  });
  const boards = invokeLambda.Payload
    ? (JSON.parse(Buffer.from(invokeLambda.Payload).toString("utf-8")) as {
        id: string;
        name: string;
      }[][])
    : [];
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
