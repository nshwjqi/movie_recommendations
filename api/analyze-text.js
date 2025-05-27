// api/analyze-text.js - OpenAI 용

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// services/apiService.js 에서 POST 요청을 받으면 실행됨 
export default async function handler(req, res) {
  // cors 오류 방지
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed'});}

  try {
    const { textInputs, questions } = req.body;

    // 입력 검증
    if (!textInputs || !questions) {
      return res.status(400).json({ 
        error: 'textInputs과 questions가 필요합니다.' 
      });
    }

    console.log('analyze-text.js에서 openapi ai 분석 중...');

    const analyses = [];
    
    // 각 주관식 답변을 하나씩 분석
    for (const [questionId, userInput] of Object.entries(textInputs)) {
      if (!userInput || userInput.trim().length < 3) continue;
      
      const question = questions.find(q => q.id === parseInt(questionId));
      const questionContext = question ? question.text : '';
      
      try {
        // 아래 정의된 주관식 답변 분석 함수 실행 후 리턴값 저장
        const analysis = await analyzeSubjectiveAnswer(userInput, questionContext);
        if (analysis && analysis.confidence > 30) {
          analyses.push(analysis);
        }
      } catch (error) {
        console.warn('${questionId}번 질문 분석 실패:', error.message);
      }
      
      // api 호출 간격 설정
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (analyses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        analysis: null,
        message: '주관식 답변 분석 불가능.'
      });
    }

    // 최종 분석 결과
    const combinedAnalysis = combineAnalyses(analyses);
    
    console.log('최종 분석 완료:', combinedAnalysis);
    
    return res.status(200).json({
      success: true,
      analysis: combinedAnalysis
    });
  } 
  catch (error) {
    console.error('최종 분석 결과 에러-1:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '최종 분석 결과 에러-1-1'
    });
  }
}

// 주관식 답변 분석 함수(ai)
async function analyzeSubjectiveAnswer(userInput, questionContext = '') {
  // createAnalysisPrompt 함수는 아래에 정의
  const prompt = createAnalysisPrompt(userInput.trim(), questionContext);

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '당신은 영화 취향 분석 전문가입니다. 사용자의 답변을 정확히 분석해서 JSON 형식으로만 응답하세요.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  });

  const analysisText = response.choices[0].message.content;
  const analysis = JSON.parse(analysisText);
  
  // 해당 함수 역시 아래 정의
  return validateAnalysis(analysis);
}

// ai에게 전달할 프롬프트 생성용
// 위 analyzeSubjectiveAnswer 함수에서 쓰임
function createAnalysisPrompt(userInput, questionContext) {
  return `당신은 영화 취향 분석 전문가입니다. 사용자의 답변을 분석해서 영화 추천을 위한 정보를 추출해주세요.

질문 맥락: ${questionContext}
사용자의 답변: "${userInput}"

다음 형식으로만 응답해주세요 (JSON 형식):

{
  "genres": [28, 35, 18],
  "keywords": ["액션", "코미디", "감동"],
  "preferredDecade": "2000s",
  "runtime": { "start": 90, "end": 150 },
  "ratingPreference": "high",
  "confidence": 85
}

필드 설명:
- genres: TMDB 장르 ID 배열
  * 28=액션, 35=코미디, 18=드라마, 10749=로맨스, 27=공포, 53=스릴러
  * 878=SF, 14=판타지, 16=애니메이션, 80=범죄, 99=다큐멘터리
  * 10751=가족, 36=역사, 10402=음악/뮤지컬, 9648=미스터리, 12=어드벤처
- keywords: 핵심 키워드 3-5개 (영화 검색에 도움되는 구체적인 단어들)
- runtime: 선호 상영시간 (분 단위) { "start": 최소분, "end": 최대분 }
- ratingPreference: "high" (고평점), "popular" (인기작), "balanced" (균형), "niche" (틈새) 중 하나
- confidence: 분석 신뢰도 (0-100, 명확할수록 높은 점수)

분석 가이드라인:
1. 영화 감상 목적 분석: 
   - "밥친구", "휴식" → 가벼운 장르, 짧은 런타임
   - "기념", "여유" → 깊이 있는 장르, 긴 런타임 허용
   
2. 시대적 배경/분위기 분석:
   - 언급된 연도나 시대적 키워드 추출
   - 클래식, 현대, 미래적 등의 테마 파악
   
3. 음악/분위기 선호 분석:
   - "발라드" → 로맨스, 가족, 드라마
   - "댄스" → 음악/뮤지컬, 코미디
   - "인디" → 로맨스, 드라마, 가족
   
4. 감정적 반응 분석:
   - "숨막히는 서스펜스" → 스릴러, 미스터리
   - "액션" → 액션, 어드벤처
   - "감동" → 드라마, 가족
   - "설레는 긴장감" → 로맨스
   
5. 평가 기준 분석:
   - "대중성" → popular, 높은 투표수
   - "평론가" → high rating
   - "숨겨진 보석" → niche, 낮은 투표수
   
6. 원하는 감정 상태:
   - "여운" → 가족, 드라마
   - "흥분" → 액션, 어드벤처, 판타지
   - "생각" → SF, 미스터리

예시:
- "밥친구로 가볍게" → runtime: {start: 60, end: 120}
- "1980년대 자유로운 분위기" → preferredDecade: "1980s"
- "로맨틱한 발라드" → genres: [10749]
- "평론가 찬사" → ratingPreference: "high"

사용자 답변에서 추출할 수 없는 정보는 null로 설정하세요.
반드시 유효한 JSON 형식으로만 응답하세요.`;
}

// 분석 결과 검증 함수 정의
function validateAnalysis(analysis) {
  const validated = {
    genres: [],
    keywords: [],
    preferredDecade: null,
    runtime: null,
    ratingPreference: null,
    confidence: 0
  };

  // 분석 결과가 TMDB 장르에 있는 값인지 비교, 맞으면 입력
  const validGenres = [28, 35, 18, 10749, 27, 53, 878, 14, 16, 80, 99, 10751, 36, 10402, 9648, 10770, 37, 10752, 12];
  if (Array.isArray(analysis.genres)) {
    validated.genres = analysis.genres.filter(id => validGenres.includes(id));
  }

  // 분석 결과에 키워드 있으면 입력
  if (Array.isArray(analysis.keywords)) {
    validated.keywords = analysis.keywords.slice(0, 5);
  }

  // 분석 결과에 올바른 연도 있으면 입력
  const validDecades = ['1920s', '1950s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  if (validDecades.includes(analysis.preferredDecade)) {
    validated.preferredDecade = analysis.preferredDecade;
  }

  // 런타임 확인
  if (analysis.runtime && typeof analysis.runtime.start === 'number' && 
      typeof analysis.runtime.end === 'number' && analysis.runtime.start > 0 && 
      analysis.runtime.end > analysis.runtime.start && analysis.runtime.end <= 300) 
      { 
        validated.runtime = {
          start: Math.round(analysis.runtime.start),
          end: Math.round(analysis.runtime.end)
        };
  }

  // 평점 선호도 검증
  const validRatingPrefs = ['high', 'popular', 'balanced', 'niche'];
  if (validRatingPrefs.includes(analysis.ratingPreference)) {
    validated.ratingPreference = analysis.ratingPreference;
  }

  // 신뢰도 입력(결과 출력에서 사용)
  if (typeof analysis.confidence === 'number' && analysis.confidence >= 0 && analysis.confidence <= 100) {
    validated.confidence = Math.round(analysis.confidence);
  }

  return validated;
}

// 여러 분석 결과를 취합해서 결론냄
function combineAnalyses(analyses) {
  // 최종 결과 객체
  const combined = {
    genres: [],
    keywords: [],
    preferredDecade: null,
    confidence: 0
  };

  // 장르 빈도순으로 가장 많이 나오는 장르들 고름
  const genreCount = {};
  analyses.forEach(analysis => {
    analysis.genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });
  combined.genres = Object.keys(genreCount)
    .sort((a, b) => genreCount[b] - genreCount[a])
    .slice(0, 3)
    .map(Number);

  // 키워드 취합
  const allKeywords = analyses.flatMap(analysis => analysis.keywords);
  combined.keywords = [...new Set(allKeywords)].slice(0, 5);

  // 배경 연도 취합
  const decadeCount = {};
  analyses.forEach(analysis => {
    if (analysis.preferredDecade) {
      decadeCount[analysis.preferredDecade] = (decadeCount[analysis.preferredDecade] || 0) + 1;
    }
  });
  combined.preferredDecade = Object.keys(decadeCount).sort((a, b) => decadeCount[b] - decadeCount[a])[0] || null;

  // 평균 신뢰도 계산
  combined.confidence = Math.round(
    analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length
  );

  return combined;
}