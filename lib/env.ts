import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SYNC_SECRET: z.string().min(24).optional(),
  TMDB_API_KEY: z.string().min(10).optional(),
  ADMIN_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SYNC_SECRET: process.env.SYNC_SECRET,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
});
