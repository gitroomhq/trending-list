
## Know when you are trending over GitHub

I have created a simple tool that let you monitor repositories trending.
Every hour it scrapes GitHub main feed and language feed and send you an email if one of your repositories is trending.

It uses
- PostgresSQL (Prisma)
- NextJS
- [Trigger.dev](https://github.com/triggerdotdev/trigger.dev) (Background Jobs)
- [Novu](https://github.com/novuhq/novu)

Just copy `.env.example` to `.env` and fill the missing values.
