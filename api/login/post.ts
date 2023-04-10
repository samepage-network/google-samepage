import createAPIGatewayProxyHandler from "samepage/backend/createAPIGatewayProxyHandler";
import { z } from "zod";
import { oauth2_v2 } from "@googleapis/oauth2";

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
  return {
    renderActions: {
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
                  widgets: [
                    {
                      textParagraph: {
                        text: "We tried logging in",
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
};

export default createAPIGatewayProxyHandler(logic);
