/** Keep one essay per book until the UI supports an explicit essay list. */
export function indexEssays<T extends { id: string; data: { bookId: string } }>(
  bookIds: Iterable<string>,
  essays: T[],
): Map<string, T> {
  const knownBooks = new Set(bookIds);
  const index = new Map<string, T>();
  for (const essay of essays) {
    const bookId = essay.data.bookId;
    if (!knownBooks.has(bookId)) {
      throw new Error(`Essay "${essay.id}" references unknown book "${bookId}".`);
    }
    if (index.has(bookId)) {
      throw new Error(`More than one essay references book "${bookId}".`);
    }
    index.set(bookId, essay);
  }
  return index;
}
