import {Novu} from "@novu/node";

export const novu = new Novu(process.env.NOVU_SECRET!);
