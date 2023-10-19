import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "@trending/trigger";
import { z } from "zod";
import { novu, repoTopic } from "@trending/helpers/novu";
import { prisma } from "../../prisma/prisma";

client.defineJob({
  id: "create-novu-topic",
  name: "Create Novu Topic",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "repo.created",
    schema: z.object({
      id: z.number(),
    }),
  }),
  //this function is run when the custom event is received
  run: async (payload, io, ctx) => {
    const repository = await io.runTask(
      "get-repository",
      async () => {
        return prisma.repositories.findUnique({
          where: {
            id: payload.id,
          },
        });
      },
      {
        icon: "brand-prisma",
      }
    );

    if (!repository) {
      await io.logger.error("Repository not found", { payload });

      return;
    }

    const topic = repoTopic(repository);

    await io.runTask(
      "create-topic",
      async () => {
        const response = await novu.topics.create({
          name: "notifications for repository",
          key: topic,
        });

        return response.data;
      },
      {
        name: "Create Novu Topic",
        icon: "novu",
        properties: [
          {
            label: "topic",
            text: topic,
          },
        ],
      }
    );
  },
});

client.defineJob({
  id: "subscribe-to-novu",
  name: "Subscribe to Novu",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "user-repo.created",
    schema: z.object({
      id: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const userRepo = await io.runTask(
      "get-user-repository",
      async () => {
        return prisma.userRepository.findUnique({
          where: {
            id: payload.id,
          },
          include: {
            repository: true,
            user: true,
          },
        });
      },
      {
        icon: "database",
        name: "Get Repo",
      }
    );

    if (!userRepo) {
      await io.logger.error("User Repository not found", { payload });

      return;
    }

    const email = userRepo.user.email;

    if (!email) {
      await io.logger.error("User email not found", { payload });

      return;
    }

    const topic = repoTopic(userRepo.repository);

    await io.runTask(
      "subscribe-to-topic",
      async () => {
        const response = await novu.topics.addSubscribers(topic, {
          subscribers: [email],
        });

        return response.data;
      },
      {
        name: "Subscribe To Novu Topic",
        icon: "novu",
        properties: [
          {
            label: "topic",
            text: topic,
          },
        ],
      }
    );
  },
});
