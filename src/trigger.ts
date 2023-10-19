import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "trending-3C5s",
  apiKey: process.env.TRIGGER_API_KEY,
  apiUrl: process.env.TRIGGER_API_URL,
});
