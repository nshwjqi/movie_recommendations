// api/recommend-movie.js - TMDB 용

import axios from 'axios';

// tmdb에 http 요청하는 axios 객체
const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 10000,
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'ko-KR'
  }
});

export default async function handler(req, res) {
  // cors 오류 방지
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 들어온 요청 바디 분해
    const { answers, questions, aiAnalysis } = req.body;

    // 입력 검증
    if (!answers || !questions) {
      return res.status(400).json({ 
        error: 'answers, questions 필요.' 
      });
    }

    console.log('recommend-movie.js 영화 추천 시작');

    // 1. 객관식 답변으로 1차 조건 설정
    const basicCriteria = buildRecommendationCriteria(answers, questions);

    // 2. 1차 조건과 ai 분석 결과 통합
    const finalCriteria = mergeCriteriaWithAI(basicCriteria, aiAnalysis);
    
    // 3. 2번 조건에 맞는 영화를 찾을 수 없으면 조건 완화 
    const searchResult = await performProgressiveSearch(finalCriteria);
    
    if (!searchResult.movie) {
      return res.status(404).json({
        success: false,
        error: '조건에 맞는 영화를 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      success: true,
      movie: searchResult.movie,
      searchAttempts: searchResult.attempts,
      criteria: finalCriteria
    });

  } catch (error) {
    console.error('reco-movie handler 에러:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'reco-movie handler 오류'
    });
  }
}

// 객관식 답변으로 1차 조건 생성
function buildRecommendationCriteria(answers, questions) {
  const criteria = {};

  // 질문들 하나씩 분해
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    
    if (!userAnswer || !question.mapping || question.type === 'text') { return; }
    if (question.textInputTrigger && userAnswer === question.textInputTrigger) { return; }
    
    // 질문에 객관식으로 답했을 때 선택지에 맵핑되어 있던 각각의 필터링 criteria로 옮김
    const mapping = question.mapping[userAnswer];
    if (mapping) {
      if (mapping.genres) {
        criteria.genres = [...(criteria.genres || []), ...mapping.genres];
      }
      
      if (mapping.yearRange) {
        criteria.yearRange = mapping.yearRange;
      }

      if (mapping.with_runtime) {
        criteria.runtime = mapping.with_runtime;
      }

      if (mapping.sortBy) {
        criteria.sortBy = mapping.sortBy;
      }
      
      if (mapping.minVoteCount) {
        criteria.minVoteCount = mapping.minVoteCount;
      }
      
      if (mapping.maxVoteCount) {
        criteria.maxVoteCount = mapping.maxVoteCount;
      }
      
      if (mapping.minRating) {
        criteria.minRating = mapping.minRating;
      }
    }
  });

  return criteria;
}

// 1차 조건과 ai 분석 결과 aiAnalysis 통합
function mergeCriteriaWithAI(basicCriteria, aiAnalysis) {
  const merged = { ...basicCriteria };

  // ai 분석 신뢰도 너무 낮으면 그냥 기본 분석으로 진행
  if (!aiAnalysis || aiAnalysis.confidence < 50) { return merged; }

  // 장르 추가
  if (aiAnalysis.genres && aiAnalysis.genres.length > 0) {
    merged.genres = [...(merged.genres || []), ...aiAnalysis.genres];
    merged.genres = [...new Set(merged.genres)];
  }

  // 연도 추가
  if (aiAnalysis.preferredDecade && !merged.yearRange) {
    const decadeToYear = {
      '1920s': { start: 1920, end: 1940 },
      '1950s': { start: 1950, end: 1970 },
      '1980s': { start: 1980, end: 1999 },
      '2000s': { start: 2000, end: 2015 },
      '2010s': { start: 2016, end: 2025 },
      '2020s': { start: 2020, end: 2025 }
    };

    if (decadeToYear[aiAnalysis.preferredDecade]) {
      merged.yearRange = decadeToYear[aiAnalysis.preferredDecade];
    }
  }

  if (aiAnalysis.runtime && aiAnalysis.runtime.start && aiAnalysis.runtime.end) {
    merged.runtime = aiAnalysis.runtime;
  }

  if (aiAnalysis.ratingPreference && !merged.sortBy) {
    const ratingToSort = {
      'high': 'vote_average.desc',
      'popular': 'popularity.desc', 
      'balanced': 'popularity.desc',
      'niche': 'vote_average.desc'
    };
    if (ratingToSort[aiAnalysis.ratingPreference]) {
      merged.sortBy = ratingToSort[aiAnalysis.ratingPreference]; }
  }

  merged.aiAnalysis = aiAnalysis;
  return merged;
}

// 조건에 맞는 영화가 없을 경우 조건 완화
async function performProgressiveSearch(criteria) {
  let movies = [];
  let searchAttempt = 1;
  const maxAttempts = 4;

  // searchAttempt가 4가 될 때까지 시도
  while (movies.length === 0 && searchAttempt <= maxAttempts) {
    const searchParams = buildSearchParams(criteria, searchAttempt);
    
    const response = await tmdbApi.get('/discover/movie', { params: searchParams });
    movies = response.data.results;

    if (movies.length === 0) {
      searchAttempt++;
    }
  }

  // 끝까지 찾지 못하고 빠져나오면 인기순 영화 랜덤 선택
  if (movies.length === 0) {
    const fallbackResponse = await tmdbApi.get('/movie/popular', { params: { page: 1 } });
    movies = fallbackResponse.data.results;
    searchAttempt = 'fallback';
  }

  // 조건에 맞게 찾은 영화들 중 가장 적합한 영화 선택
  const selectedMovie = selectBestMatch(movies.slice(0, 20), criteria);
  
  // 추천 이유 생성
  selectedMovie.recommendationReason = generateRecommendationReason(
    criteria, 
    selectedMovie, 
    searchAttempt
  );

  return {
    movie: selectedMovie,
    attempts: searchAttempt
  };
}

// TMDB 영화 검색 필터링 조건 파라미터
function buildSearchParams(criteria, attempt = 1) {
  const searchParams = {
    page: 1,
    include_adult: false
  };

  switch (attempt) {
    case 1:
      searchParams.sort_by = criteria.sortBy || 'popularity.desc';
      searchParams['vote_count.gte'] = criteria.minVoteCount || 100;
      
      if (criteria.genres && criteria.genres.length > 0) { searchParams.with_genres = criteria.genres.join(','); }
      if (criteria.yearRange) {
        searchParams['primary_release_date.gte'] = `${criteria.yearRange.start}-01-01`;
        searchParams['primary_release_date.lte'] = `${criteria.yearRange.end}-12-31`;
      }
      if (criteria.runtime) {
        searchParams['with_runtime.gte'] = criteria.runtime.start;
        searchParams['with_runtime.lte'] = criteria.runtime.end;
      }
      if (criteria.minRating) { searchParams['vote_average.gte'] = criteria.minRating; }
      if (criteria.maxVoteCount) {
        searchParams['vote_count.lte'] = criteria.maxVoteCount;
      }
      break;

    case 2:
      searchParams.sort_by = criteria.sortBy || 'popularity.desc';
      searchParams['vote_count.gte'] = Math.max((criteria.minVoteCount || 100) - 50, 50);
      
      if (criteria.genres && criteria.genres.length > 0) {
        searchParams.with_genres = criteria.genres.join(','); }
      if (criteria.yearRange) {
        searchParams['primary_release_date.gte'] = `${Math.max(criteria.yearRange.start - 5, 1980)}-01-01`;
        searchParams['primary_release_date.lte'] = `${Math.min(criteria.yearRange.end + 5, 2025)}-12-31`;
      }
      if (criteria.minRating && criteria.minRating > 6.0) {
        searchParams['vote_average.gte'] = criteria.minRating - 1.0;
      }
      break;

    case 3:
      searchParams.sort_by = 'popularity.desc';
      searchParams['vote_count.gte'] = 50;
      
      if (criteria.genres && criteria.genres.length > 0) {
        searchParams.with_genres = criteria.genres[0].toString();
      }
      if (criteria.yearRange) {
        searchParams['primary_release_date.gte'] = `${Math.max(criteria.yearRange.start - 10, 1920)}-01-01`;
        searchParams['primary_release_date.lte'] = `2025-12-31`;
      }
      break;

    case 4:
      searchParams.sort_by = 'popularity.desc';
      searchParams['vote_count.gte'] = 50;
      
      if (criteria.genres && criteria.genres.length > 0) {
        searchParams.with_genres = criteria.genres[0].toString();
      }
      break;
  }

  return searchParams;
}

// 조건에 맞게 찾은 영화들 중 가장 적합한 영화 선택
function selectBestMatch(movies, criteria) {

  // 영화에 점수 매기기
  const scoredMovies = movies.map(movie => {
    let score = 0;

    // 기본 품질 점수
    const qualityScore = (movie.vote_average / 10) * Math.log10(movie.popularity + 1);
    score += qualityScore * 30;

    // ai 키워드 매칭
    if (criteria.aiAnalysis && criteria.aiAnalysis.keywords) {
      const movieText = (movie.title + ' ' + (movie.overview || '')).toLowerCase();
      const keywordMatches = criteria.aiAnalysis.keywords.filter(keyword => 
        movieText.includes(keyword.toLowerCase())
      ).length;
      score += (keywordMatches / criteria.aiAnalysis.keywords.length) * 20;
    }

    // 최근에 나온 영화일수록 + 점수
    if (movie.release_date) {
      const releaseYear = new Date(movie.release_date).getFullYear();
      const currentYear = new Date().getFullYear();
      const freshnessScore = Math.max(0, 10 - (currentYear - releaseYear) * 0.5);
      score += freshnessScore;
    }

    // 랜덤 점수 추가
    score += Math.random() * 5;

    return { ...movie, matchScore: score };
  });

  // 점수별로 정렬
  scoredMovies.sort((a, b) => b.matchScore - a.matchScore);

  // 상위 3개 중 가중치 주고 랜덤 선택
  const topCandidates = scoredMovies.slice(0, Math.min(3, scoredMovies.length));
  const weights = [0.6, 0.3, 0.1];
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < topCandidates.length; i++) {
    cumulativeWeight += weights[i] || 0;
    if (random <= cumulativeWeight) {
      return topCandidates[i];
    }
  }

  return topCandidates[0];
}

// 결과 출력
function generateRecommendationReason(criteria, movie, searchAttempt) {
  const reasons = [];
  
  let baseReason = `당신의 답변을 분석하여 선정한 영화입니다.`;

  if (searchAttempt !== 'fallback' && searchAttempt > 1) {
    baseReason += ` (${searchAttempt}차 검색을 통해 발견)`;
  }

  if (criteria.aiAnalysis && criteria.aiAnalysis.confidence >= 50) {
    baseReason += ` (AI 분석 신뢰도: ${criteria.aiAnalysis.confidence}%)`;
  }

  return baseReason;
}