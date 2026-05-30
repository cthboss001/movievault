import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchMovie } from "@/lib/tmdb/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Find up to 20 movies that haven't been enriched yet
    const movies = await prisma.movie.findMany({
      where: {
        tmdbId: null,
      },
      take: 20,
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    if (movies.length === 0) {
      return NextResponse.json({ message: "No movies left to enrich", enriched: 0, totalRemaining: 0 });
    }

    let enrichedCount = 0;
    
    // Process them sequentially to avoid hammering the TMDB API
    for (const movie of movies) {
      try {
        const tmdbData = await searchMovie(movie.title, movie.year);
        
        if (tmdbData) {
          await prisma.movie.update({
            where: { id: movie.id },
            data: {
              tmdbId: tmdbData.id,
              posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null,
              overview: tmdbData.overview || null,
            }
          });
          enrichedCount++;
        } else {
          // Mark as enriched but with no data so we don't keep retrying it infinitely.
          // For this MVP, we'll assign a dummy TMDB ID of 0 or a negative number to indicate "not found",
          // or we can just leave it null and rely on `lastSyncedAt`. 
          // Let's use a negative ID for "not found on TMDB".
          await prisma.movie.update({
            where: { id: movie.id },
            data: {
              tmdbId: -1,
            }
          });
        }
        
        // Sleep for 100ms to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to enrich movie ${movie.title}:`, err);
        // Continue to the next one
      }
    }

    const totalRemaining = await prisma.movie.count({
      where: {
        tmdbId: null,
      }
    });

    return NextResponse.json({
      message: "Batch complete",
      enriched: enrichedCount,
      processed: movies.length,
      totalRemaining
    });

  } catch (err) {
    console.error("Enrichment error:", err);
    return NextResponse.json({ error: "Failed to run enrichment" }, { status: 500 });
  }
}
