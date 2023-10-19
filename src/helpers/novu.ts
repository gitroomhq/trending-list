import { Novu } from "@novu/node";
import { Repositories } from "@prisma/client";

export const novu = new Novu(process.env.NOVU_SECRET!);

export function repoTopic(repo: Repositories) {
  // Convert the repository URL to a topic with the format:
  // From https://github.com/triggerdotdev/trigger.dev
  // to triggerdotdev-trigger.dev

  const url = new URL(repo.url);
  const path = url.pathname.split("/").filter(Boolean);
  const topic = path.join("-");

  return `repository:${topic}`;
}
