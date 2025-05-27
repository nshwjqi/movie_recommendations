// src/services/apiService.js- Vercel serverless function

import axios from 'axios';

const API_BASE_URL = '/api'; 

// axios로 http 요청값 가지고 올 수 있게 함
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// request 서버 전송 디버깅과 예외처리
apiClient.interceptors.request.use(
  (config) => {
    console.log('apiService.js Vercel API 요청:', config.method.toUpperCase(), config.url);
    return config; },
  (error) => {
    console.error('apiService.js Vercel API 요청 에러:', error);
    return Promise.reject(error);
  }
);

// response 디버깅과 예외처리
apiClient.interceptors.response.use(
  (response) => {
    console.log('apiService.js Vercel API 응답 성공');
    return response; },
  (error) => {
    console.error('apiService.js Vercel API 응답 에러:', error.response?.status, error.response?.data || error.message);
    
    // 어떤 에러인지 처리
    if (error.response?.status === 429) {
      throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'); } 
    else if (error.response?.status >= 500) {
      throw new Error('서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'); }
    else if (error.code === 'ECONNABORTED') {
      throw new Error('요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.'); }
    
    return Promise.reject(error);
  }
);

// 아래 getPersonalizedRecommendation에 쓰이는 주관식 답변을 분석하는 비동기 함수, /analyze-text 호출
export const analyzeSubjectiveAnswers = async (textInputs, questions) => {
  try {
    console.log('apiServices.js에서 analyze-text.js로 openai api ai 분석 요청', textInputs);
    
    // axios 객체에 있는 POST 메소드로 opneai api에 post 요청을 보냄
    const response = await apiClient.post('/analyze-text', {
      textInputs,
      questions
    });

    if (response.data.success) {
      console.log('openai api 분석 완료:', response.data.analysis);
      return response.data.analysis; } 
    else {
      throw new Error(response.data.error || 'openai 분석 실패'); }    
  } catch (error) {
    console.error('apiService.js 주관식 답변 openai 분석 에러:', error.message);
    throw error;
  }
};

// 아래 getPersonalizedRecommendation 에 쓰이는 영화 추천 함수 정의, /recommend-movie 호출
export const getMovieRecommendation = async (answers, questions, aiAnalysis = null) => {
  try {
    console.log('apiService.js->recommend-movie 영화 추천 요청 중...');
    
    const response = await apiClient.post('/recommend-movie', {
      answers,
      questions,
      aiAnalysis
    });

    if (response.data.success) {
      console.log('apiService.js<-recommend-movie 영화 추천 완료:', response.data.movie.title);
      return {
        movie: response.data.movie,
        searchAttempts: response.data.searchAttempts,
        criteria: response.data.criteria
      }; } 
    else {
      throw new Error(response.data.error || '영화 추천 실패'); }
  } catch (error) {
    console.error('apiService.js <-> recommend-movie 에러:', error.message);
    throw error;
  }
};

// 주관식(ai 분석)과 객관식(정해진 답안) 분석해서 종합적으로 영화 추천하는 함수
export const getPersonalizedRecommendation = async (answers, questions, textInputs = {}) => {
  try {
    console.log('apiService.js getPersonalizedRecommendation() 통합 영화 분석 중...');
    
    // 1. 주관식 답변이 있으면 ai가 분석
    let aiAnalysis = null;
    const isSubjective = Object.values(textInputs).some(input => input && input.trim().length > 3);
    
    if (isSubjective) {
      try {
        aiAnalysis = await analyzeSubjectiveAnswers(textInputs, questions);
      } 
      catch (error) { console.warn('AI 분석 실패, 기본 추천으로 진행:', error.message); } }

    // 2. 최종 영화 추천
    const recommendation = await getMovieRecommendation(answers, questions, aiAnalysis);
    
    console.log('영화 선정 성공: ', recommendation.movie.title);
    return recommendation.movie;
  } catch (error) {
    console.error('영화 선정 에러: ', error.message);
    throw error;
  }
};

// 결과 화면에서의 포스터 출력을 위해 이미지 링크 생성
export const getImageUrl = (posterPath) => {
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  return posterPath ? `${IMAGE_BASE_URL}${posterPath}` : null;
};