import {eventTrigger} from "@trigger.dev/sdk";
import {client} from "@trending/trigger";
import {z} from "zod";
import {prisma} from "../../prisma/prisma";
import {novu} from "@trending/helpers/novu";
import {TriggerRecipientsTypeEnum} from "@novu/shared";
import {extractGithubInfo} from "@trending/pages/api/add";

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
      const findMany = await prisma.repositories.findMany({
          where: {
              url: {
                  notIn: payload.links,
              },
              ...(payload.language === '' ? {} : {language: payload.language}),
              ...payload.language === '' ? {
                  trendingPlace: {
                      gt: 0
                  }
              } : {
                  languagePlace: {
                      gt: 0
                  }
              }
          }
      });

      for (const repo of findMany) {
          const extract = extractGithubInfo(repo.url);
          if (!extract) {
              continue;
          }

          await prisma.repositories.update({
              where: {
                  id: repo.id
              },
              data: payload.language === '' ? {
                  trendingPlace: 0
              } : {
                  languagePlace: 0
              }
          });

          await prisma.repositoriesHistory.create({
              data: {
                  place: 0,
                  language: payload.language,
                  repositoryId: repo.id
              }
          });

          await novu.trigger('trending', {
              to: [{
                  type: TriggerRecipientsTypeEnum.TOPIC,
                  topicKey: `repository:${repo.id}`
              }],
              payload: {
                  text: payload.language ?
                      `That was a good run! ${extract.owner}/${extract.name} is not trending for ${repo.language} anymore` :
                      `Nice run! ${extract.owner}/${extract.name} is not trending on the main feed anymore`
              }
          });
      }
  },
});