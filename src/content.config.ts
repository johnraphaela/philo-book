import { z, defineCollection } from 'astro:content';
// 최신 Astro에서 폴더 내의 파일을 읽어오기 위해 glob 로더를 가져옵니다.
import { glob } from 'astro/loaders'; 

const booksCollection = defineCollection({
  // JSON 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.json", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    theme: z.string(),
    categories: z.array(z.string()),
    ageGroups: z.array(z.string()),
    pages: z.array(z.object({
      image: z.string(),
      text: z.string(),
      hint: z.string().optional()
    })),
    harvardPlay: z.array(z.object({
      title: z.string(),
      desc: z.string()
    })).optional()
  })
});

const essaysCollection = defineCollection({
  // MDX 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.mdx", base: "./src/content/essays" }),
  schema: z.object({
    title: z.string(),
    bookId: z.string(),
    tags: z.array(z.string())
  })
});

export const collections = {
  'books': booksCollection,
  'essays': essaysCollection,
};