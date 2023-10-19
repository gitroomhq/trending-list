import { Novu } from "@novu/node";
import { Repositories } from "@prisma/client";

export const novu = new Novu(process.env.NOVU_SECRET!);

export function repoTopic(repo: Repositories) {
  return `repository:${repo.id}`;
}
