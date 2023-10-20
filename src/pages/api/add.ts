// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { allLanguages } from "@trending/helpers/all.languages";
import { nextOptions } from "@trending/pages/api/auth/[...nextauth]";
import { client } from "@trending/trigger";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../prisma/prisma";

export const extractGithubInfo = (url: string) => {
  const regex = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
  const match = url.match(regex);

  if (match) {
    return {
      owner: match[1],
      name: match[2],
    };
  } else {
    return false;
  }
};
const getLanguages = async (url: string, token: string) => {
  const extract = extractGithubInfo(url);
  if (!extract) return false;

  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${extract.owner}/${extract.name}/languages`,
      {
        headers: {
          authorization: `token ${token}`,
        },
        withCredentials: true,
      }
    );

    const findLanguage = Object.keys(data).reduce((all, current) => {
      if (data[current] > all) {
        return data[current];
      }
      return all;
    });

    const slug = allLanguages.find(
      (p) => p.name.toLowerCase() === findLanguage.toLowerCase()
    );
    if (!slug?.slug) {
      return false;
    }
    return slug?.slug;
  } catch (err) {
    return false;
  }
};

const upsertRepository = async (repository: string, language: string) => {
  const existingRepo = await prisma.repositories.findUnique({
    where: {
      url: repository,
    },
  });

  if (existingRepo) {
    return existingRepo;
  }

  const createdRepo = await prisma.repositories.create({
    data: {
      url: repository,
      language: language as string,
      languagePlace: 0,
      trendingPlace: 0,
    },
  });

  await client.sendEvent({
    id: [createdRepo.id, "repo.created"].join(":"),
    name: "repo.created",
    payload: {
      id: createdRepo.id,
    },
  });

  return createdRepo;
};

const upsertUserRepository = async (repositoryId: number, userId: string) => {
  const existingUserRepo = await prisma.userRepository.findUnique({
    where: {
      repositoryId_userId: {
        repositoryId,
        userId,
      },
    },
  });

  if (existingUserRepo) {
    return existingUserRepo;
  }

  const createdUserRepo = await prisma.userRepository.create({
    data: {
      repositoryId,
      userId,
    },
  });

  await client.sendEvent({
    id: [createdUserRepo.id, "user-repo.created"].join(":"),
    name: "user-repo.created",
    payload: {
      id: createdUserRepo.id,
    },
  });

  return createdUserRepo;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (
    req.method !== "POST" ||
    !req?.body?.repository ||
    !req.body.repository.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/)
  ) {
    res.status(200).json({ valid: false });
    return;
  }

  if (req.body.repository.at(-1) === "/") {
    req.body.repository = req.body.repository.slice(0, -1);
  }

  const session = await getServerSession(req, res, nextOptions);

  if (!session?.user) {
    res.status(200).json({ valid: false });
    return;
  }

  const language = await getLanguages(
    req.body.repository,
    session.user.access_token
  );

  if (!language) {
    res.status(200).json({ valid: false });
    return;
  }

  const repository = await upsertRepository(req.body.repository, language);
  const userRepo = await upsertUserRepository(repository.id, session.user.id);

  res
    .status(200)
    .json({ valid: true, id: repository.id, userRepo: userRepo.id });
}
