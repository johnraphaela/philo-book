export const AGE_BANDS = [
  { id: 'early', label: '5–7세', min: 5, max: 7 },
  { id: 'lower', label: '8–9세', min: 8, max: 9 },
  { id: 'upper', label: '10–12세', min: 10, max: 12 },
] as const;
export const TOPICS = [
  { id: 'identity', label: '자아와 정체성' },
  { id: 'change', label: '변화와 성장' },
  { id: 'self-esteem', label: '자존감과 감정' },
] as const;
export type LibraryItem = {
  id: string;
  data: {
    title: string; theme: string; categories: string[]; summary?: string;
    order?: number; topics: string[]; recommendedAge?: { min: number; max: number };
  };
};
export function ageBandIds(age?: { min: number; max: number }): string[] {
  return AGE_BANDS.filter(band => age && age.min <= band.max && age.max >= band.min).map(band => band.id);
}
export function sortBooks<T extends LibraryItem>(books: T[]): T[] {
  return [...books].sort((a, b) => (a.data.order ?? 100) - (b.data.order ?? 100) || a.id.localeCompare(b.id));
}
export function matchesBook(book: LibraryItem, query: string, age: string, topic: string): boolean {
  const text = [book.data.title, book.data.theme, book.data.summary ?? '', ...book.data.categories,
    ...TOPICS.filter(t => book.data.topics.includes(t.id)).map(t => t.label)].join(' ').normalize('NFKC').toLocaleLowerCase();
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return words.every(word => text.includes(word)) && (!age || ageBandIds(book.data.recommendedAge).includes(age))
    && (!topic || book.data.topics.includes(topic));
}
