import { Job, cronTrigger } from "@trigger.dev/sdk";
import {client} from "@trending/trigger";
import {prisma} from "../../prisma/prisma";

client.defineJob({
  id: "check-trending",
  name: "Check trending",
  version: "0.0.1",
  trigger: cronTrigger({
    cron: "0 * * * *",
  }),
  run: async (payload, io, ctx) => {
    const repositories = await prisma.repositories.findMany({
      select: {
        language: true,
      },
      distinct: ["language"],
    });

    for (const repository of [{language: ''}, ...repositories]) {
      await io.logger.info("trigger for " + repository.language);
      await io.sendEvent('process-language-' + repository.language, {
        name: "process.language",
        payload: {
            language: repository.language,
        }
      });
    }

    await io.logger.info("repo", {
      repositories,
    });

    return { repositories };
  },
});