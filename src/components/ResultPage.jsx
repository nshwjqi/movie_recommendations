// components/ResultPage.jsx
import React, { useState, useEffect } from 'react';
import { getPersonalizedRecommendation, getImageUrl } from '../services/apiService';

/* questions={questions}
        answers={answers}
        textInputs={textInputs}
        onStartNew={handleStartNew} */


const ResultPage = ({ questions, answers, textInputs, onStartNew }) => {
  // 추천한 영화데이터 상태변수
  const [recommendedMovie, setRecommendedMovie] = useState(null);
  // 영화 로딩 중... 임을 알 수 있도록 하는 설정 변수
  const [loading, setLoading] = useState(true);
  // 예외처리 변수
  const [error, setError] = useState(null);

  // 선택한 모든 객관식 답과 질문, 주관식 답을 의존성 배열로 받음
  /* 처음 한 번 실행하고 저장된 답과 질문이 바뀔 때 함수가 실행되지만, 
  // 마지막 페이지에서 사용자가 일반적인 방법으로는 답과 질문을 바꿀 수 없으므로 사실상 시작(새로고침)할 때 한 번 실행 */
  useEffect(() => {
    // openai를 통해 사용자의 주관식 답변에서 필터링 단서를 분석하는 비동기 함수 정의
    const fetchRecommendedMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('개인화된 영화 추천을 가져오는 중...');
        console.log('사용자 답변:', answers);
        
        // getPersonalizedRecommendation 함수는 src/services/apiService에서 가져오는 최종적인 추천 영화 선정 함수
        // openai를 통해 주관식 답변을 분석하고 객관식 답변은 정해진 필터링을 설정하여 영화를 선정함
        const movie = await getPersonalizedRecommendation(answers, questions, textInputs);
        console.log('추천된 영화:', movie);
        // 영화데이터 recommendedMovie 상태변수에 저장
        setRecommendedMovie(movie);
      } catch (err) {
        //예외처리
        console.error('영화 추천 에러:', err);
        setError(`영화 추천을 가져오는데 실패했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // 위에서 정의한 openai 분석 비동기 함수 실행
    fetchRecommendedMovie();
  }, [answers, questions, textInputs]);

  return (
    <div className="result-container">
      <div id="shareable-content" className="shareable-content">
        <div className="share-header">
          <h2>영화 추천 결과</h2>
          <div className="survey-date">
            {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>
        
        <div className="results">
          {questions.map(question => {
            const objectiveAnswer = answers[question.id];
            const subjectiveAnswer = textInputs[question.id];
            
            return (
              <div key={question.id} className="result-item">
                <h3>{question.text}</h3>
                
                { /* 객관식 */ }
                {question.type !== 'text' && (
                  <p>
                    <strong>선택:</strong> {objectiveAnswer || '응답하지 않음'}
                  </p>
                )}
                
                { /* 주관식 */ }
                {(question.type === 'text' || 
                  (question.type === 'mixed' && objectiveAnswer === question.textInputTrigger)) && (
                  <div className="subjective-answer">
                    <strong>입력 내용:</strong>
                    <div className="text-answer">
                      {subjectiveAnswer || (question.isOptional ? '(선택사항 - 미입력)' : '응답하지 않음')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="movie-recommendation">
          <h2>추천 결과</h2>
          
          {loading && (
            <div className="loading">
              <p>영화 탐색 중...</p>
              <div className="loading-spinner">⧖</div>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}
          
          {recommendedMovie && !loading && (
            <div className="movie-card">
              <div className="movie-poster">
                {recommendedMovie.poster_path ? (
                  <img 
                    src={getImageUrl(recommendedMovie.poster_path)} 
                    alt={recommendedMovie.title}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="no-poster">포스터 없음</div>
                )}
              </div>
              <div className="movie-info">
                <h3>{recommendedMovie.title}</h3>
                
                {recommendedMovie.recommendationReason && (
                  <div className="recommendation-reason">
                    <p>{recommendedMovie.recommendationReason}</p>
                  </div>
                )}
                
                <p className="movie-overview">
                  {recommendedMovie.overview || '줄거리 정보가 없습니다.'}
                </p>
                <div className="movie-details">
                  <span className="release-date">
                    <strong>개봉일:</strong> {recommendedMovie.release_date}
                  </span>
                  <span className="rating">
                    <strong>평점:</strong> ⭐ {recommendedMovie.vote_average?.toFixed(1)}
                  </span>
                  {recommendedMovie.vote_count && (
                    <span className="vote-count">
                      <strong>평가 수:</strong> {recommendedMovie.vote_count.toLocaleString()}명
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button className="nav-button" onClick={onStartNew}>
        처음으로 돌아가기
      </button>
    </div>
  );
};

export default ResultPage;