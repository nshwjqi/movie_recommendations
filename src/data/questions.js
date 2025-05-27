// src/data/questions.js

// 사용자의 취향 분석에 필요한 질문과 선택지 객체

const questions = [
  {
    id: 1,
    text: '무엇을 위해 영화를 볼 예정인가요?',
    type: 'mixed',
    options: [
      '식사하면서 밥친구로',
      '바쁘게 일하다가 쉬면서',
      '여유로운 날의 기념으로',
      '심심함을 달래기 위해',
      '기타 (직접 입력)'
    ],
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    textInputPlaceholder: '100자 이내',
    textInputMaxLength: 100,
    mapping: {
      '식사하면서 밥친구로': { 
        with_runtime: { start: 60, end: 120 },
      },
      '바쁘게 일하다가 쉬면서': { 
        with_runtime: { start: 60, end: 130 }
      },
      '여유로운 날의 기념으로': { 
        with_runtime: { start: 80, end: 180 }
      },
      '심심함을 달래기 위해': { 
        with_runtime: { start: 80, end: 180 }
      },
    }
  },
  {
    id: 2,
    text: '원하는 영화 개봉 연도는?',
    type: 'mixed',
    options: [
      '1920년대(벤허, 어셔가의 몰락 등)',
      '1950년대(열차 안의 낯선 자들, 로마의 휴일 등)',
      '1980년대(샤이닝, 천공의 성 라퓨타 등)',
      '2000년대(아바타, 월-E, 아이언맨 등)',
      '2010년대(퍼시픽 림, 인터스텔라, 혹성탈출 등)',
      '기타 (직접 입력)'
    ],
    // 주관식 있는지
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    // 부연설명 (html placeholder 용)
    textInputPlaceholder: '원하는 시대나 배경을 상상해서 써주세요 (예: 그리스 로마 시대, 조선 후기 등)',
    textInputMaxLength: 100,
    // 선택지 별 영화 취향 분석 필터링
    mapping: {
      '1920년대(벤허, 어셔가의 몰락 등)': { 
        yearRange: { start: 1920, end: 1940 }
      },
      '1950년대(열차 안의 낯선 자들, 로마의 휴일 등)': { 
        yearRange: { start: 1950, end: 1970 }
      },
      '1980년대(샤이닝, 천공의 성 라퓨타 등)': { 
        yearRange: { start: 1980, end: 1999 }
      },
      '2000년대(아바타, 월-E, 아이언맨 등)': { 
        yearRange: { start: 2000, end: 2015 }
      },
      '2010년대(퍼시픽 림, 인터스텔라, 혹성탈출 등)': { 
        yearRange: { start: 2016, end: 2025 },
        genres: [878]
      }
    }
  },
  {
    id: 3,
    text: '주인공과 연인이 처음 마주치는 장면, 어떤 배경 음악을 원하나요?',
    type: 'mixed',
    options: [
      '로맨틱한 발라드',
      '경쾌한 팝송', 
      '신나는 댄스 음악',
      '잔잔한 인디 음악',
      '기타 (직접 입력)'
    ],
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    textInputPlaceholder: '100자 이내',
    textInputMaxLength: 100,
    mapping: {
      '로맨틱한 발라드': { 
        genres: [10749, 18]
      },
      '경쾌한 팝송': { 
        genres: [35, 10749]
      },
      '신나는 댄스 음악': { 
        genres: [35, 10402]
      },
      '잔잔한 인디 음악': { 
        genres: [18, 10749]
      }
    }
  },
  {
    id: 4,
    text: '영화가 가장 고조되는 순간, 당신이 원하는 것은?',
    type: 'mixed',
    options: [
      '설레는 긴장감',
      '스릴 넘치는 액션',
      '숨막히는 서스펜스',
      '감동의 눈물',
      '쉴 틈 없는 웃음',
      '기타 (직접 입력)'
    ],
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    textInputPlaceholder: '관객들의 어떤 반응이 가장 즐거울지 자유롭게 써주세요',
    textInputMaxLength: 100,
    mapping: {
      '설레는 긴장감': { 
        genres: [10749, 18], 
        sortBy: 'vote_average.desc'
      },
      '스릴 넘치는 액션': { 
        genres: [28, 12], 
        sortBy: 'popularity.desc'
      },
      '숨막히는 서스펜스': { 
        genres: [53, 9648], 
        sortBy: 'vote_average.desc'
      },
      '감동의 눈물': { 
        genres: [18, 10751], 
        sortBy: 'vote_average.desc'
      },
      '쉴 틈 없는 웃음': { 
        genres: [35],
        sortBy: 'popularity.desc'
      }
    }
  },
  {
    id: 5,
    text: '어떤 평가를 받는 영화를 보고 싶나요?',
    type: 'mixed',
    options: [
      '모르는 사람이 없는 영화',
      '평론가들의 찬사를 받는 영화',
      '입소문을 타서 오래 회자되는 영화',
      '숨겨진 보석이라는 말을 듣는 영화',
      '아는 사람만 아는 광팬이 있는 영화',
      '기타 (직접 입력)'
    ],
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    textInputPlaceholder: '어떤 성격의 영화를 만들고 싶은지 자유롭게 표현해주세요',
    textInputMaxLength: 100,
    mapping: {
      '모르는 사람이 없는 영화': { 
        sortBy: 'popularity.desc', 
        minVoteCount: 5000
      },
      '평론가들의 찬사를 받는 영화': { 
        sortBy: 'vote_average.desc', 
        minVoteCount: 1000, 
        minRating: 7.5
      },
      '입소문을 타서 오래 회자되는 영화': { 
        sortBy: 'popularity.desc', 
        minVoteCount: 2000, 
        minRating: 7.0
      },
      '숨겨진 보석이라는 말을 듣는 영화': { 
        sortBy: 'vote_average.desc', 
        minVoteCount: 100, 
        maxVoteCount: 1000,
        minRating: 7.0
      },
      '아는 사람만 아는 광팬이 있는 영화': { 
        sortBy: 'vote_average.desc', 
        minVoteCount: 50, 
        maxVoteCount: 500,
        minRating: 6.5
      }
    }
  },
  {
    id: 6,
    text: '영화가 끝나면 당신은 어떤 기분을 느끼고 싶나요?',
    type: 'mixed',
    options: [
      '따뜻한 여운',
      '신나는 흥분',
      '깊은 생각에 잠김',
      '감동의 눈물',
      '누군가와 얘기하고 싶은 기분',
      '기타 (직접 입력)'
    ],
    hasTextInput: true,
    textInputTrigger: '기타 (직접 입력)',
    textInputPlaceholder: '100자 이내',
    textInputMaxLength: 100,
    mapping: {
      '따뜻한 여운': { 
        genres: [10749, 10751]
      },
      '신나는 흥분': { 
        genres: [28, 12]
      },
      '깊은 생각에 잠김': { 
        genres: [18, 878]
      },
      '감동의 눈물': { 
        genres: [18]
      },
      '누군가와 얘기하고 싶은 기분': { 
        genres: [35, 28]
      }
    }
  },
  {
    id: 7,
    text: '마지막으로, 당신이 가장 좋아하는 영화나 인상 깊었던 영화 장면을 자유롭게 서술해주세요.',
    type: 'text',
    textInputPlaceholder: '예: 가타카의 엔딩 장면 - 두 주인공의 대비되는 모습이 인상깊었다.',
    textInputMaxLength: 150,
    isOptional: true
  }
];

export default questions;