// components/QuestionPage.jsx
import React, { useState, useEffect } from 'react';

 /* question={questions[currentQuestionIndex]}
        selectedAnswer={answers[questions[currentQuestionIndex].id]}
        textInput={textInputs[questions[currentQuestionIndex].id]}
        onSelectAnswer={handleSelectAnswer}
        onTextInputChange={handleTextInputChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleComplete}
        isFirstQuestion={currentQuestionIndex === 0}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}  */

const QuestionPage = ({
  question,
  selectedAnswer,
  textInput,
  onSelectAnswer,
  onTextInputChange,
  onNext,
  onPrevious,
  onComplete,
  isFirstQuestion,
  isLastQuestion,
  currentIndex,
  totalQuestions
}) => {
  // 현재 입력 중인 텍스트에 대한 변수
  const [localTextInput, setLocalTextInput] = useState(textInput || '');
  // 글자수 세기 상태변수
  const [charCount, setCharCount] = useState(0);
  // 텍스트 입력창 표시 상태변수
  const [showTextInput, setShowTextInput] = useState(false);

  // 진행률 바 표시를 위한 질문 진행률 계산
  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;

  // 컴포넌트 마운트 시 텍스트 입력 상태 확인
  /* useEffect가 question, selectedAnswer, textInput 변수를 받음. 해당 변수들의 값이 바뀔 때 다시 렌더링(함수 실행)
    부모 컴포넌트인 App.jsx에서 받아온 변수들로 question은 question.js에서 받아온 질문 리스트 중 현재 질문의 정보
    selectedAnswer는 현재 선택한 객관식 답변(없으면 undefined)
    textInput은 현재 선택한 주관식 답변(없으면 undefined)
    즉 현재 질문이 바뀌거나, 선택한 답변이 바뀔 때 useEffect 함수가 다시 렌더링 후 출력되어 화면 구성을 결정
    */
  useEffect(() => {
    if (question.type === 'text') {
      //질문 타입이 text(완전 주관식)일 경우 텍스트 입력창 표시
      setShowTextInput(true);
    } else if (question.type === 'mixed' && question.textInputTrigger) {
      // 질문 타입이 주관식+객관식일 때 클릭한 답변이 '기타'라면 텍스트 입력창 표시
      setShowTextInput(selectedAnswer === question.textInputTrigger);
    }
    //입력 중인 텍스트 갱신
    setLocalTextInput(textInput || '');

    setCharCount((textInput || '').length);
  }, [question, selectedAnswer, textInput]);

  // 객관식을 선택하는 이벤트 함수 생성
  // onSelectAnswer는 부모 컴포넌트의 handleSelectAnswer함수(사용자가 객관식 답변을 선택할 경우의 함수)
  const handleOptionSelect = (option) => {
    onSelectAnswer(question.id, option);
    
    // 만약 선택한 객관식이 기타(주관식)일 경우 텍스트 입력란 한 번 더 표시
    // 화면 깜박거림 방지 위함
    if (question.type === 'mixed' && question.textInputTrigger) {
      if (option === question.textInputTrigger) {
        setShowTextInput(true);
      } else {
        setShowTextInput(false);
        setLocalTextInput('');
        onTextInputChange(question.id, '');
      }
    }
  };

  // 주관식을 선택할 때 발생하는 이벤트 핸들러 생성, e는 이벤트 객체
  const handleTextInputChange = (e) => {
    // 사용자가 입력한 값을 받아와 최대 글자수보다 작으면 저장
    const value = e.target.value;
    const maxLength = question.textInputMaxLength || 100;
    
    if (value.length <= maxLength) {
      // 현재 입력 중인 텍스트 갱신
      setLocalTextInput(value);
      // 사용한 글자수 갱신
      setCharCount(value.length);
      // 아래 함수는 App.jsx 컴포넌트에서 받아온 handleTextInputChange 함수
      // (사용자가 주관식 답변을 선택할 경우 로컬 스토리지에 질문답변 저장)
      onTextInputChange(question.id, value);
    }
  };

  // 다음 질문으로 넘어가는 버튼 클릭 시 사용자가 답변하고 넘어가는지 여부 확인
  const isAnswered = () => {
    if (question.type === 'text') {
      // 공백 제거하고 판별
      return question.isOptional || localTextInput.trim().length > 0;
    } else if (question.type === 'mixed') {
      if (!selectedAnswer) return false;
      if (selectedAnswer === question.textInputTrigger) {
        return localTextInput.trim().length > 0;
      }
      return true;
    } else {
      return !!selectedAnswer;
    }
  };

  return (
    /* 질문 화면 UI, 자바스크립트 코드로 사용자가 행동을 취했을 때(버튼 클릭, 답 입력 등) 이벤트 핸들러들 맵핑 */
    <div className="question-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      { /* 질문 내용 표시 */}
      <div className="question">
        <h2>
          <span className="question-number">{currentIndex + 1}</span>
          {question.text}
          {!question.isOptional && question.type === 'text' && (
            <span className="required-indicator">*</span>
          )}
          {question.isOptional && <span className="optional-label">(선택사항)</span>}
        </h2>
        
        {question.options && (
          <div className="options">
            {question.options.map((option, index) => (
              // question의 객관식 답변들 화면에 출력, 하나 클릭하면 객관식을 선택할 때의 이벤트 함수 실행 
              <div 
                key={index} 
                className={`option ${selectedAnswer === option ? 'selected' : ''} ${
                  option.includes('기타') || option.includes('직접 입력') ? 'other-option' : ''
                }`}
                onClick={() => handleOptionSelect(option)}
              >
                { option.includes('기타') ? (
                  <>
                   {option}
                  </>
                ) : (option) }
              </div>
            ))}
          </div>
        )}

        {/* 주관식 답변 입력 */}
        {(showTextInput || question.type === 'text') && (
          <div className="text-input-section">
            <textarea
              className="text-input"
              placeholder={question.textInputPlaceholder || '100자 내 입력'}
              value={localTextInput}
              onChange={handleTextInputChange}
              maxLength={question.textInputMaxLength || 100}
              rows={question.type === 'text' ? 4 : 3}
            />
            <div className="char-counter">
              <span className={charCount >= (question.textInputMaxLength || 100) * 0.9 ? 'warning' : ''}>
                {charCount}/{question.textInputMaxLength || 100}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="navigation">
        {!isFirstQuestion && (
          <button className="nav-button" onClick={onPrevious}>
            이전
          </button>
        )}
        
        {!isLastQuestion ? (
          <button 
            className="nav-button"
            onClick={onNext}
            disabled={!isAnswered()}
          >
            다음
          </button>
        ) : (
          <button 
            className="nav-button complete"
            onClick={onComplete}
            disabled={!isAnswered()}
          >
            추천받기
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionPage;