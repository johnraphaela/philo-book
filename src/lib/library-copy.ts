/** Short shelf introductions; manuscripts and publication metadata remain unchanged. */
const introductions: Record<string, { theme: string; summary: string }> = {
  'ep01-robot-mong': {
    theme: '변화 속에서도 이어지는 나',
    summary: '몸의 부품이 달라져도 몽은 여전히 몽일까요? 로봇 몽과 함께 나를 나답게 만드는 것을 생각해요.',
  },
  'ep02-self-esteem': {
    theme: '스스로 발견하는 나의 가치',
    summary: '아무도 바라보지 않아도 루미의 빛은 소중해요. 꼬마 등대와 함께 스스로의 힘을 발견해요.',
  },
  'ep03-hope': {
    theme: '작은 실천으로 만드는 희망',
    summary: '무지개를 기다리던 림보가 작은 물방울을 모으기 시작해요. 파랑새와 함께 희망을 만드는 한 걸음을 찾아요.',
  },
  'pico-silver-feather': {
    theme: '비교를 넘어 찾는 나다움',
    summary: '친구들보다 빠르게 날고 싶던 피코가 자신만의 날개를 만나요. 아기 새와 함께 나다운 기쁨을 찾아요.',
  },
  ep05: {
    theme: '서로를 배려하는 공정한 약속',
    summary: '놀이터를 만들던 친구들이 비밀의 망토를 입어 봐요. 숲속 친구들과 함께 모두를 위한 약속을 생각해요.',
  },
};

export function getLibraryCopy(id: string, original: { theme: string; summary?: string }) {
  return introductions[id] ?? { theme: original.theme, summary: original.summary };
}
