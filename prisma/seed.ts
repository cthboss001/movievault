import { PrismaClient, WatchSource } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const movie = await prisma.movie.upsert({
    where: { tmdbId: 550 },
    update: {},
    create: {
      title: "Fight Club",
      normalizedTitle: "fight club",
      year: 1999,
      overview:
        "An insomniac office worker and a soap maker form an underground fight club.",
      posterUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      runtimeMinutes: 139,
      tmdbId: 550,
      imdbId: "tt0137523",
      watches: {
        create: {
          source: WatchSource.LETTERBOXD,
          watchedDate: new Date("2024-01-01"),
          rating: 4.5,
          sourceUrl: "https://letterboxd.com/film/fight-club/",
          sourceEntryId: "letterboxd:fight-club:2024-01-01"
        }
      }
    }
  });

  const genre = await prisma.genre.upsert({
    where: { slug: "drama" },
    update: {},
    create: {
      name: "Drama",
      slug: "drama"
    }
  });

  await prisma.movieGenre.upsert({
    where: {
      movieId_genreId: {
        movieId: movie.id,
        genreId: genre.id
      }
    },
    update: {},
    create: {
      movieId: movie.id,
      genreId: genre.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
