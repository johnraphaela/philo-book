import { CONTENT_CATEGORIES, CONTENT_SUBTOPICS } from './taxonomy.ts';

type CardMetadata = {
  primaryCategory?: string;
  theme?: string;
  subtopics?: readonly string[];
  categories?: readonly string[];
  recommendedAge?: { min: number; max: number };
  ageGroups?: readonly string[];
};

/** Display only; filtering continues to use the complete original metadata. */
export function getCardMetadata(data: CardMetadata) {
  const category = CONTENT_CATEGORIES.find(category => category.id === data.primaryCategory)?.label
    ?? data.theme?.trim() ?? '';
  const subtopics = (data.subtopics ?? []).flatMap(id => {
    const topic = CONTENT_SUBTOPICS.find(topic => topic.id === id);
    return topic ? [topic.label] : [];
  });
  const tags = [...new Set(subtopics.length ? subtopics : data.categories ?? [])]
    .filter(tag => tag.trim() && tag !== category).slice(0, 2);
  const age = data.recommendedAge
    ? `${data.recommendedAge.min}~${data.recommendedAge.max}세`
    : (data.ageGroups ?? []).map(age => age.replace(/\\~/g, '~')
      .replace(/(\d)[–-](?=\d)/g, '$1~').trim()).filter(Boolean).join(' · ');
  return { category, tags, age };
}
