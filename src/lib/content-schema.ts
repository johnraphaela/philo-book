import { z } from 'astro/zod';
import { TOPICS } from './library.ts';
import { CONTENT_CATEGORIES, CONTENT_SUBTOPICS } from './taxonomy.ts';

export const bookSchema = z.object({
    sourceBookId: z.string().min(1).optional(),
    title: z.string().min(1),
    theme: z.string(),
    summary: z.string().min(1).optional(),
    primaryCategory: z.enum(CONTENT_CATEGORIES.map(category => category.id)).optional(),
    subtopics: z.array(z.enum(CONTENT_SUBTOPICS.map(topic => topic.id))).optional(),
    coreQuestion: z.string().trim().min(1).max(180).optional(),
    dialogueQuestions: z.array(z.string()).optional(),
    parentReflectionQuestion: z.string().optional(),
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
      teachingPoint: z.string().min(1).optional(),
      interaction: z.string().min(1).optional(),
      english: z.string().optional(),
      imageAlt: z.string().optional()
    })).min(1),
    harvardPlay: z.array(z.object({
      title: z.string().min(1),
      desc: z.string()
    })).optional()
  });

export const essaySchema = z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    bookId: z.string(),
    tags: z.array(z.string())
  });
