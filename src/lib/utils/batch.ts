/**
 * Verwerkt een array in batches van maximaal `batchSize` items tegelijk.
 * Tussen elke batch wordt `delayMs` milliseconden gewacht.
 * Voorkomt rate limiting bij externe API's zoals de FPL API.
 *
 * @example
 *   const results = await batchedAll(playerIds, fetchPlayer, 5, 100);
 */
export async function batchedAll<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 5,
  delayMs = 100,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);

    // Wacht tussen batches (niet na de laatste)
    if (i + batchSize < items.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
