import { getCollection } from 'astro:content';
import { sortBooks } from './library';
import { indexEssays } from './relationships';

export async function getLibrary() {
  const [books, essays] = await Promise.all([
    getCollection('books'),
    getCollection('essays'),
  ]);
  const essaysByBook = indexEssays(books.map((book) => book.id), essays);
  return sortBooks(books).map((book) => ({ book, essay: essaysByBook.get(book.id) }));
}
