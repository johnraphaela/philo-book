/** Per-book display choices. Unlisted books keep the components' existing defaults. */
interface BookPresentation {
  illustrationAspectRatio?: '16/9' | '4/3';
  illustrationFit?: 'cover' | 'contain';
  coverAspectRatio?: '4/3';
  activityTabLabel?: string;
  activityHeading?: string;
  activityEyebrow?: string;
}

const picoPresentation: Readonly<BookPresentation> = {
  illustrationAspectRatio: '4/3',
  illustrationFit: 'contain',
  coverAspectRatio: '4/3',
  activityTabLabel: '🎲 생각 놀이',
  activityHeading: '함께 나누는 생각 놀이',
  activityEyebrow: '반응적 상호작용을 참고한 부모·아이 놀이',
};
const defaultPresentation: Readonly<BookPresentation> = {};

export function getBookPresentation(bookId: string): Readonly<BookPresentation> {
  return bookId === 'pico-silver-feather' ? picoPresentation : defaultPresentation;
}
