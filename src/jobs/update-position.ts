import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "@trending/trigger";
import { z } from "zod";
import { prisma } from "../../prisma/prisma";
import { novu, repoTopic } from "@trending/helpers/novu";
import { TriggerRecipientsTypeEnum } from "@novu/shared";
import { extractGithubInfo } from "@trending/pages/api/add";

const buildMessage = (
  link: string,
  newRank: number,
  oldRank: number,
  language: string
) => {
  const extract = extractGithubInfo(link);
  if (!extract) {
    return "";
  }

  if (oldRank === 0) {
    return language
      ? `Wow! ${extract.owner}/${extract.name} is now trending for ${language} on place ${newRank}`
      : `OMG! ${extract.owner}/${extract.name} is now trending on the main feed on place ${newRank}`;
  } else if (oldRank > newRank) {
    return language
      ? `Yay! ${extract.owner}/${extract.name} bumped from place ${oldRank} to place ${newRank} on ${language}`
      : `Super! ${extract.owner}/${extract.name} bumped from place ${oldRank} to place ${newRank} on the main feed`;
  } else if (newRank > oldRank) {
    return language
      ? `Bummer! ${extract.owner}/${extract.name} downgraded from place ${oldRank} to place ${newRank} on ${language}`
      : `Damn! ${extract.owner}/${extract.name} downgraded from place ${oldRank} to place ${newRank} on the main feed`;
  }
};

client.defineJob({
  id: "update-position",
  name: "Update position",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "update.position",
    schema: z.object({
      link: z.string(),
      language: z.string(),
      rank: z.number(),
    }),
  }),
  //this function is run when the custom event is received
  run: async (payload, io, ctx) => {
    const repository = await prisma.repositories.findUnique({
      where: {
        url: payload.link,
      },
    });

    if (!repository) {
      return;
    }

    await io.runTask(
      "update-repository",
      async () => {
        await prisma.repositories.updateMany({
          where: {
            id: repository.id,
          },
          data:
            payload.language === "__all"
              ? {
                  trendingPlace: payload.rank,
                }
              : {
                  languagePlace: payload.rank,
                },
        });
      },
      {
        icon: "brand-prisma",
        name: "Update Repo",
        properties: [{ label: "ID", text: String(repository.id) }],
      }
    );

    await io.runTask(
      "create-history",
      async () => {
        return await prisma.repositoriesHistory.create({
          data: {
            repositoryId: repository.id,
            language: payload.language,
            place: payload.rank,
          },
        });
      },
      {
        icon: "brand-prisma",
        name: "Create Repo History",
        properties: [
          { label: "ID", text: String(repository.id) },
          { label: "Language", text: payload.language },
          { label: "Rank", text: String(payload.rank) },
        ],
      }
    );

    const message = buildMessage(
      payload.link,
      payload.rank,
      repository.language ? repository.languagePlace : repository.trendingPlace,
      payload.language
    );

    if (!message) {
      await io.logger.debug("No message to send", { payload, repository });

      return;
    }

    return await io.runTask(
      "send-novu-message",
      async () => {
        const response = await novu.trigger("trending", {
          to: [
            {
              type: TriggerRecipientsTypeEnum.TOPIC,
              topicKey: repoTopic(repository),
            },
          ],
          payload: {
            text: message,
          },
        });

        return response.data;
      },
      {
        name: "Send Message to Novu Topic",
        icon: "novu",
        properties: [
          {
            label: "topic",
            text: repoTopic(repository),
          },
        ],
      }
    );
  },
});
