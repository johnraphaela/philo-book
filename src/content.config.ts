import { defineCollection } from 'astro:content';
import { bookSchema, essaySchema } from './lib/content-schema.ts';
// 최신 Astro에서 폴더 내의 파일을 읽어오기 위해 glob 로더를 가져옵니다.
import { glob } from 'astro/loaders'; 

const booksCollection = defineCollection({
  // JSON 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.json", base: "./src/content/books" }),
  schema: bookSchema
});

const essaysCollection = defineCollection({
  // MDX 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/essays" }),
  schema: essaySchema
});

export const collections = {
  'books': booksCollection,
  'essays': essaysCollection,
};
