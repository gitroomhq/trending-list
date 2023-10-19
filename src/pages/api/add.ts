// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {prisma} from "../../../prisma/prisma";
import axios from "axios";
import {nextOptions} from "@trending/pages/api/auth/[...nextauth]";
import {getServerSession} from "next-auth/next";
import {allLanguages} from "@trending/helpers/all.languages";
import {novu} from "@trending/helpers/novu";

export const extractGithubInfo = (url: string) => {
  const regex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(regex);

  if (match) {
    return {
      owner: match[1],
      name: match[2]
    };
  } else {
    return false;
  }
}
const getLanguages = async (url: string, token: string) => {
  const extract = extractGithubInfo(url);
  if (!extract) return false;

  try {
    const {data} = await axios.get(`https://api.github.com/repos/${extract.owner}/${extract.name}/languages`, {
      headers: {
        authorization: `token ${token}`,
      },
      withCredentials: true
    });

    const findLanguage = Object.keys(data).reduce((all, current) => {
      if (data[current] > all) {
        return data[current];
      }
      return all;
    });

    const slug = allLanguages.find(p => p.name.toLowerCase() === findLanguage.toLowerCase());
    if (!slug?.slug) {
      return false;
    }
    return slug?.slug;
  }
  catch (err) {
    return false;
  }
}

const createRepository = async (repository: string, language: string) => {
  try {
    const create = await prisma.repositories.create({
      data: {
        url: repository, language: language as string, languagePlace: 0, trendingPlace: 0
      }
    });

    await novu.topics.create({
      name: 'notifications for repository',
      key: `repository:${create.id}`
    });

    return create;
  }
  catch (err) {
    return false;
  }
}
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
  // @ts-ignore
  const language = await getLanguages(req.body.repository, session.user.access_token);
  if (!language) {
    res.status(200).json({ valid: false });
  }

  const repository = await createRepository(req.body.repository, language as string) || await prisma.repositories.findFirst({
    where: {
      url: req.body.repository
    }
  });

  try {
    await prisma.userRepository.create({
      data: {
        // @ts-ignore
        userId: session.user.id as string, // @ts-ignore
        repositoryId: repository.id as number
      }
    });

    await novu.topics.addSubscribers(`repository:${repository?.id!}`, {
      // @ts-ignore
      subscribers: [session.user.email]
    });
  }
  catch (err) {
    res.status(200).json({ valid: false });
  }

  res.status(200).json({ valid: true })
}
