export const AGE_BANDS = [
  { id: '5-6', label: '5~6세', min: 5, max: 6 },
  { id: '7-8', label: '7~8세', min: 7, max: 8 },
  { id: '9-10', label: '9~10세', min: 9, max: 10 },
  { id: '11-12', label: '11~12세', min: 11, max: 12 },
] as const;
// Legacy publication-schema values only; shelf filtering uses categories below.
export const TOPICS = [
  { id: 'identity', label: '자아와 정체성' },
  { id: 'change', label: '변화와 성장' },
  { id: 'self-esteem', label: '자존감과 감정' },
] as const;
type AgeRange = { min: number; max: number };
export type LibraryItem = {
  id: string;
  data: {
    title: string; theme: string; categories: string[]; summary?: string;
    order?: number; topics?: string[]; recommendedAge?: AgeRange; ageGroups?: string[];
  };
};
const categoryAliases = new Map([
  ['자존감', '자존감'], ['자아존중감', '자존감'],
  ['사회철학', '사회철학'], ['정서발달', '정서 발달'],
  ['사회성발달', '사회성 발달'], ['자기효능감', '자기효능감'], ['자기만족', '자기만족'],
]);
export function normalizeCategory(category: string): string {
  const label = category.normalize('NFKC').trim().replace(/\s+/g, ' ');
  return categoryAliases.get(label.replace(/\s+/g, '')) ?? label;
}
export function categoryOptions(books: readonly LibraryItem[]): { id: string; label: string }[] {
  const labels = new Set(books.flatMap(book => book.data.categories.map(normalizeCategory)).filter(Boolean));
  return [...labels].sort((a, b) => a.localeCompare(b, 'ko')).map(label => ({ id: label, label }));
}
export function ageBandIds(age?: AgeRange): string[] {
  return AGE_BANDS.filter(band => age && age.min <= band.max && age.max >= band.min).map(band => band.id);
}
/** Explicit structured ages take precedence; do not guess numeric ages from school labels. */
export function bookAgeRanges(book: LibraryItem): AgeRange[] {
  if (book.data.recommendedAge) return [book.data.recommendedAge];
  return (book.data.ageGroups ?? []).flatMap(label => {
    const normalized = label.normalize('NFKC').replace(/\\(?=~)/g, '').trim();
    const range = /^(\d{1,2})\s*(?:세\s*)?[-~–—〜～]\s*(\d{1,2})\s*세(?:\s*추천)?$/.exec(normalized);
    const single = /^(\d{1,2})\s*세(?:\s*추천)?$/.exec(normalized);
    const min = Number(range?.[1] ?? single?.[1]);
    const max = Number(range?.[2] ?? single?.[1]);
    return Number.isInteger(min) && min >= 0 && max <= 18 && min <= max ? [{ min, max }] : [];
  });
}
export function bookAgeBandIds(book: LibraryItem): string[] {
  const ages = bookAgeRanges(book);
  return AGE_BANDS.filter(band => ages.some(age => age.min <= band.max && age.max >= band.min)).map(band => band.id);
}
export function sortBooks<T extends LibraryItem>(books: T[]): T[] {
  return [...books].sort((a, b) => (a.data.order ?? 100) - (b.data.order ?? 100) || a.id.localeCompare(b.id));
}
export function matchesBook(book: LibraryItem, query: string, age: string, topic: string): boolean {
  const categories = book.data.categories.map(normalizeCategory);
  const text = [book.data.title, book.data.theme, book.data.summary ?? '', ...book.data.categories,
    ...categories].join(' ').normalize('NFKC').toLocaleLowerCase();
  const words = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).map(normalizeCategory);
  return words.every(word => text.includes(word)) && (!age || bookAgeBandIds(book).includes(age))
    && (!topic || categories.includes(normalizeCategory(topic)));
}
