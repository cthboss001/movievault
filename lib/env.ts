import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SYNC_SECRET: z.string().min(24).optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SYNC_SECRET: process.env.SYNC_SECRET
});
