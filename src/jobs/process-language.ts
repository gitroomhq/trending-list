import {eventTrigger} from "@trigger.dev/sdk";
import {client} from "@trending/trigger";
import {z} from "zod";
import axios from "axios";
import { JSDOM } from 'jsdom';
import {prisma} from "../../prisma/prisma";

client.defineJob({
  id: "process-language",
  name: "Process language",
  version: "0.1.0",
  trigger: eventTrigger({
    name: "process.language",
    schema: z.object({
      language: z.string(),
    }),
  }),
  //this function is run when the custom event is received
  run: async (payload, io, ctx) => {
    const {data} = await axios.get(`https://github.com/trending/${payload.language.replace('#', '%23')}`);
    const dom = new JSDOM(data);

    const list = Array.from(dom.window.document.querySelectorAll('article h2')).map((p, index) => ({
        rank: index + 1,
        name: p?.textContent?.replace(/\s+/g, ' ').trim().split('/').map(p => p.trim()).join('/'),
    }));

    const foundRepositories = await prisma.repositories.findMany({
        where: {
            ...(payload.language === '' ? {} : {language: payload.language}),
            url: {
                in: list.map(p => 'https://github.com/' + p.name),
            }
        }
    });

    for (const repository of foundRepositories) {
        const findRank = list.find(p => 'https://github.com/' + p.name === repository.url);
        if (
            (payload.language === '' && repository.trendingPlace !== findRank?.rank) ||
            (payload.language !== '' && repository.languagePlace !== findRank?.rank)
        ) {
            await io.sendEvent('update-position-' + findRank?.name?.replace('/', '-'), {
                name: 'update.position',
                payload: {
                    link: repository.url,
                    rank: findRank?.rank!,
                    language: payload.language,
                }
            });
        }
    }

    await io.sendEvent('reset-position-' + payload.language, {
      name: 'reset.positions',
      payload: {
          links: foundRepositories.map(p => p.url),
          language: payload.language,
      }
    });

    return payload;
  },
});