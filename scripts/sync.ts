import { prisma } from "@/lib/db";
import { imdbProvider, letterboxdProvider } from "@/lib/sync/providers";
import { runPublicProfileSync } from "@/lib/sync/sync-runner";

async function main() {
  const result = await runPublicProfileSync([imdbProvider, letterboxdProvider]);

  console.log(`Synced ${result.syncedCount} movies`);
  console.log(`Added ${result.addedCount} new movies`);
  console.log(`Updated ${result.updatedCount} movies`);
  console.log(`Skipped ${result.skippedCount} existing movies`);
  console.log(
    `Sources: IMDb ${result.sourceCounts.imdb}, Letterboxd ${result.sourceCounts.letterboxd}`
  );

  for (const [source, error] of Object.entries(result.sourceErrors)) {
    console.log(`${source} sync warning: ${error}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
