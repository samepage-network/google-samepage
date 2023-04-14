import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import onboardNotebook from "samepage/backend/onboardNotebook";
import { z } from "zod";
import { oauth2_v2 } from "@googleapis/oauth2";
import getHomeCard from "src/cards/getHomeCard";

const zLoginArgs = z.object({
  authorizationEventObject: z.object({
    userOAuthToken: z.string(),
  }),
  commonEventObject: z.object({
    formInputs: z.object({
      email: z.object({
        stringInputs: z.object({
          value: z
            .string()
            .array()
            .refine((x) => x.length === 1),
        }),
      }),
      password: z.object({
        stringInputs: z.object({
          value: z
            .string()
            .array()
            .refine((x) => x.length === 1),
        }),
      }),
    }),
  }),
});

const logic = async (args: unknown) => {
  const {
    commonEventObject: {
      formInputs: { email: inputEmail, password },
    },
    authorizationEventObject: { userOAuthToken },
  } = zLoginArgs.parse(args);
  const googleClient = new oauth2_v2.Oauth2({});
  const { email, hd } = await googleClient.userinfo
    .get({
      oauth_token: userOAuthToken,
    })
    .then((r) => {
      return r.data;
    });
  if (inputEmail.stringInputs.value[0] !== email) {
    return {
      renderActions: {
        action: {
          navigations: [
            {
              pushCard: {
                header: {
                  title: "Error",
                },
                sections: [
                  {
                    header: `Invalid email`,
                    widgets: [
                      {
                        textParagraph: {
                          text: "The email you attempted to log into SamePage with does not match the email you are logged into Google with. Please try again.",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
    };
  }
  const notebook = await onboardNotebook({
    email,
    password: password.stringInputs.value[0],
    workspace: hd || "",
    app: "google",
  });
  return {
    renderActions: {
      action: {
        navigations: [
          {
            popToRoot: true,
          },
          {
            pushCard: {
              header: {
                title: "Welcome to Samepage",
              },
              sections: await getHomeCard({
                uuid: notebook.notebookUuid,
                token: notebook.token,
              }),
            },
          },
        ],
      },
    },
  };
};

export default createAPIGatewayProxyHandler(logic);
