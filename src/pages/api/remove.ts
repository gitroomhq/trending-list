import type { NextApiRequest, NextApiResponse } from 'next'
import {nextOptions} from "@trending/pages/api/auth/[...nextauth]";
import {getServerSession} from "next-auth/next";
import {prisma} from "../../../prisma/prisma";
import {novu} from "@trending/helpers/novu";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' || !req?.body?.repository || !req.body.repository.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/)) {
    res.status(200).json({ valid: false });
    return ;
  }

  if (req.body.repository.at(-1) === '/') {
    req.body.repository = req.body.repository.slice(0, -1);
  }

  const session = await getServerSession(req, res, nextOptions);
  if (!session?.user) {
    res.status(200).json({ valid: false });
    return ;
  }

  const repository = await prisma.repositories.findFirst({
    where: {
      url: req.body.repository
    }
  });

  await prisma.userRepository.deleteMany({
    // @ts-ignore
    where: {
      repositoryId: repository?.id! as number,
      // @ts-ignore
      userId: session?.user?.id!
    }
  });

  await novu.topics.removeSubscribers(`repository:${repository?.id!}`, {
    // @ts-ignore
    subscribers: [session.user.email]
  });

  res.status(200).json({ valid: true })
}
