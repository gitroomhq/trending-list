import {eventTrigger} from "@trigger.dev/sdk";
import {client} from "@trending/trigger";
import {z} from "zod";
import {prisma} from "../../prisma/prisma";
import {novu} from "@trending/helpers/novu";
import {TriggerRecipientsTypeEnum} from "@novu/shared";
import {extractGithubInfo} from "@trending/pages/api/add";

const buildMessage = (link: string, newRank: number, oldRank: number, language: string) => {
    const extract = extractGithubInfo(link);
    if (!extract) {
        return '';
    }

    if (oldRank === 0) {
        return language ?
            `Wow! ${extract.owner}/${extract.name} is now trending for ${language} on place ${newRank}` :
            `OMG! ${extract.owner}/${extract.name} is now trending on the main feed on place ${newRank}`;
    }
    else if (oldRank > newRank) {
        return language ?
            `Yay! ${extract.owner}/${extract.name} bumped from place ${oldRank} to place ${newRank} on ${language}` :
            `Super! ${extract.owner}/${extract.name} bumped from place ${oldRank} to place ${newRank} on the main feed`;
    }
    else if (newRank > oldRank) {
        return language ?
            `Bummer! ${extract.owner}/${extract.name} downgraded from place ${oldRank} to place ${newRank} on ${language}` :
            `Damn! ${extract.owner}/${extract.name} downgraded from place ${oldRank} to place ${newRank} on the main feed`;
    }
}

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
      const find = await prisma.repositories.findFirst({
        where: {
          url: payload.link,
        }
      });

      if (!find) {
        return ;
      }

      await prisma.repositories.updateMany({
        where: {
          id: find.id,
        },
        data: payload.language === '' ? {
          trendingPlace: payload.rank
        } : {
          languagePlace: payload.rank
        }
      });

      await prisma.repositoriesHistory.create({
        data: {
          repositoryId: find.id,
          language: payload.language,
          place: payload.rank
        }
      });

      const message = buildMessage(payload.link, payload.rank, find.language ? find.languagePlace : find.trendingPlace, payload.language);

      if (!message) {
          return ;
      }

      await novu.trigger('trending', {
          to: [{
              type: TriggerRecipientsTypeEnum.TOPIC,
              topicKey: `repository:${find.id}`
          }],
          payload: {
              text: message,
          }
      });
  },
});