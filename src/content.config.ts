import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
// 최신 Astro에서 폴더 내의 파일을 읽어오기 위해 glob 로더를 가져옵니다.
import { TOPICS } from './lib/library';
import { glob } from 'astro/loaders'; 

const booksCollection = defineCollection({
  // JSON 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.json", base: "./src/content/books" }),
  schema: z.object({
    title: z.string().min(1),
    theme: z.string(),
    summary: z.string().min(1).optional(),
    cover: z.string().startsWith('/images/').optional(),
    order: z.number().int().nonnegative().default(100),
    recommendedAge: z.object({
      min: z.number().int().min(0).max(18),
      max: z.number().int().min(0).max(18),
    }).refine(age => age.min <= age.max, '추천 연령의 최솟값은 최댓값 이하여야 합니다.').optional(),
    topics: z.array(z.enum(TOPICS.map(topic => topic.id))).default([]),
    categories: z.array(z.string()),
    ageGroups: z.array(z.string()),
    pages: z.array(z.object({
      image: z.string(),
      text: z.string().min(1),
      hint: z.string().optional(),
      imageAlt: z.string().optional()
    })).min(1),
    harvardPlay: z.array(z.object({
      title: z.string().min(1),
      desc: z.string()
    })).optional()
  })
});

const essaysCollection = defineCollection({
  // MDX 파일이 있는 폴더 경로와 패턴을 지정합니다.
  loader: glob({ pattern: "*.mdx", base: "./src/content/essays" }),
  schema: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    bookId: z.string(),
    tags: z.array(z.string())
  })
});

export const collections = {
  'books': booksCollection,
  'essays': essaysCollection,
};
