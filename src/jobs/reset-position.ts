import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "@trending/trigger";
import { z } from "zod";
import { prisma } from "../../prisma/prisma";
import { novu, repoTopic } from "@trending/helpers/novu";
import { TriggerRecipientsTypeEnum } from "@novu/shared";
import { extractGithubInfo } from "@trending/pages/api/add";

client.defineJob({
  id: "Reset positions",
  name: "Reset positions",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "reset.positions",
    schema: z.object({
      links: z.array(z.string()),
      language: z.string(),
    }),
  }),
  //this function is run when the custom event is received
  run: async (payload, io, ctx) => {
    const repositories = await io.runTask("find-repositories", async () => {
      return await prisma.repositories.findMany({
        where: {
          url: {
            notIn: payload.links,
          },
          ...(payload.language === "__all"
            ? {}
            : { language: payload.language }),
          ...(payload.language === "__all"
            ? {
                trendingPlace: {
                  gt: 0,
                },
              }
            : {
                languagePlace: {
                  gt: 0,
                },
              }),
        },
      });
    });

    for (const repo of repositories) {
      const extract = extractGithubInfo(repo.url);

      if (!extract) {
        continue;
      }

      await io.runTask(`reset-${repo.id}`, async () => {
        await io.runTask(
          "update-in-db",
          async () => {
            await prisma.repositories.update({
              where: {
                id: repo.id,
              },
              data:
                payload.language === "__all"
                  ? {
                      trendingPlace: 0,
                    }
                  : {
                      languagePlace: 0,
                    },
            });
          },
          {
            icon: "brand-prisma",
            name: "Update Repo",
            properties: [{ label: "ID", text: String(repo.id) }],
          }
        );

        await io.runTask(
          "create-history",
          async () => {
            await prisma.repositoriesHistory.create({
              data: {
                place: 0,
                language: payload.language,
                repositoryId: repo.id,
              },
            });
          },
          {
            icon: "brand-prisma",
            name: "Create Repo History",
            properties: [{ label: "ID", text: String(repo.id) }],
          }
        );

        await io.runTask(
          "send-novu-notification",
          async () => {
            const response = await novu.trigger("trending", {
              to: [
                {
                  type: TriggerRecipientsTypeEnum.TOPIC,
                  topicKey: repoTopic(repo),
                },
              ],
              payload: {
                text: payload.language
                  ? `That was a good run! ${extract.owner}/${extract.name} is not trending for ${repo.language} anymore`
                  : `Nice run! ${extract.owner}/${extract.name} is not trending on the main feed anymore`,
              },
            });

            return response.data;
          },
          {
            icon: "novu",
            name: "Send Novu Message",
            properties: [{ label: "ID", text: String(repo.id) }],
          }
        );
      });
    }
  },
});
