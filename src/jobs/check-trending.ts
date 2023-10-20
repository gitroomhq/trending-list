import { client } from "@trending/trigger";
import { cronTrigger } from "@trigger.dev/sdk";
import { prisma } from "../../prisma/prisma";

client.defineJob({
  id: "check-trending",
  name: "Check trending",
  version: "0.0.1",
  // Run every hour
  trigger: cronTrigger({
    cron: "0 * * * *",
  }),
  run: async (payload, io, ctx) => {
    const repositories = await io.runTask(
      "get-repositories",
      async () => {
        return await prisma.repositories.findMany({
          select: {
            language: true,
          },
          distinct: ["language"],
        });
      },
      {
        icon: "brand-prisma",
      }
    );

    for (const repository of repositories) {
      await io.sendEvent(`process-language-${repository.language}`, {
        name: "process.language",
        payload: {
          language: repository.language,
        },
      });
    }

    await io.sendEvent(`process-all-language`, {
      name: "process.language",
      payload: {
        language: "__all",
      },
    });

    return { repositories };
  },
});
