// App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import QuestionPage from './components/QuestionPage';
import ResultPage from './components/ResultPage';
import questions from './data/questions';

function App() {
  /* currentQuestionIndex: 현재 보고 있는 질문 인덱스, (0부터 시작)
  // setCurrentQuestionIndex로 변수 값을 바꿀 수 있고, 변수 값이 바뀌면 화면이 새로 렌더링됨
  //  ㄴ> useState의 개념
  */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // answers 변수에 빈 객체가 들어가 있고, setAnswers를 통해 answers 객체에 값을 넣을 수 있음
  // answers의 값이 바뀌면 화면이 재 렌더링됨
  const [answers, setAnswers] = useState({}); 
  // 위와 동일. 주관식 답변 변수 관리
  const [textInputs, setTextInputs] = useState({}); 
  // 위와 동일. boolean 값이 들어가 있고, isCompleted 값이 setIsCompleted에 의해 바뀌면 화면이 렌더링됨
  // 설문이 끝났는지 묻는 변수
  const [isCompleted, setIsCompleted] = useState(false);

  const [isClicked, setIsClicked] = useState(false);

  /* useEffect로 로컬 스토리지에서 해당 사용자가 신규 유저인지, 
  접속한 적 있는지, 접속한 적 있다면 어디까지 설문에 대답했는지 확인 후 진행상황 업데이트 */
  // useEffect가 빈 의존성 배열을 받음. 화면(컴포넌트)이 처음 뜰 때 한 번만 실행됨 
  // 사이트에 처음 접속할 때 로컬 스토리지에서 저장된 답변과 상태 불러오기

  //해당 함수의 실행 과정
  /*1. 신규 설문자: 접속 -> useEffect 실행 -> localStorage 비어있을 경우 -> 첫 번째 질문 업데이트
    2. 기존 설문자: 접속 -> useEffect 실행 -> localStorage 마지막 데이터 찾음 -> 마지막으로 답변하던 질문으로 이동
    3. 완료 설문자: 접속 -> useEffect 실행 -> isCompleted: true 상태 확인 -> 결과 페이지 표시
  */
  useEffect(() => {
    const savedSurveyClick = localStorage.getItem('SurveyClick');
    if (savedSurveyClick) { setAnswers(JSON.parse(savedSurveyClick)); }

    // 로컬 스토리지에 저장된 객관식 답변 불러오기
    const savedAnswers = localStorage.getItem('surveyAnswers');
    if (savedAnswers) { setAnswers(JSON.parse(savedAnswers)); }
    
    // 주관식 답변 불러오기
    const savedTextInputs = localStorage.getItem('surveyTextInputs');
    if (savedTextInputs) { setTextInputs(JSON.parse(savedTextInputs)); }
    
    // 질문 인덱스 불러오기
    const savedIndex = localStorage.getItem('currentQuestionIndex');
    if (savedIndex !== null) { setCurrentQuestionIndex(parseInt(savedIndex)); }
    
    // 완료 상태 불러오기
    const savedCompletedState = localStorage.getItem('isCompleted');
    if (savedCompletedState !== null) {
      setIsCompleted(JSON.parse(savedCompletedState));
    }
  }, []);

  // 설문 시작 함수 isClicked 제어
  const handleClick = () => {
    setIsClicked(true);
    localStorage.setItem('isClicked', 'true');
  };

  /* 사용자가 객관식 답변을 선택할 경우의 함수 저장
    애로우 펑션 사용, 로컬 스토리지에 답 추가해서 저장
    새로 선택한 질문 아이디와 답을 setAnswers를 통해 answers 변수에 저장
  */
  const handleSelectAnswer = (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    localStorage.setItem('surveyAnswers', JSON.stringify(newAnswers));
  };

  /* 사용자가 주관식 답변을 선택할 경우의 함수 저장
    애로우 펑션 사용, 로컬 스토리지에 답 추가해서 저장
    새로 선택한 질문 아이디와 답을 setTextInputs를 통해 textInputs 변수에 저장
  */
  const handleTextInputChange = (questionId, textValue) => {
    const newTextInputs = { ...textInputs, [questionId]: textValue };
    setTextInputs(newTextInputs);
    localStorage.setItem('surveyTextInputs', JSON.stringify(newTextInputs));
  };

  /* QuestionIndex를 다음 질문으로 옮기는(다음 질문으로 이동하는) 함수 저장 */
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      // 현재 질문 인덱스 로컬 스토리지에 저장
      localStorage.setItem('currentQuestionIndex', nextIndex.toString());
    }
  };

  /* QuestionIndex를 이전 질문으로 옮기는(이전 질문으로 이동하는) 함수 저장 */
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      // 현재 질문 인덱스 로컬 스토리지에 저장
      localStorage.setItem('currentQuestionIndex', prevIndex.toString());
    }
  };

  // 설문 완료 함수(이벤트 핸들러) isCompleted 제어
  const handleComplete = () => {
    setIsCompleted(true);
    localStorage.setItem('isCompleted', 'true');
  };

  // 새 설문 시작 함수
  // 로컬 스토리지, 각 useState 변수를 초기화함
  const handleStartNew = () => {
    localStorage.removeItem('surveyAnswers');
    localStorage.removeItem('surveyTextInputs');
    localStorage.removeItem('currentQuestionIndex');
    localStorage.removeItem('isCompleted');
    localStorage.removeItem('isClicked');
    
    // useState 초기화
    setIsClicked(false);
    setAnswers({});
    setTextInputs({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  return (
    
    // 설문이 종료되지 않았을 경우 QuestionPage 컴포넌트에 값 전달, 종료되었을 경우 ResultPage에 값 전달
    <div className="app-container">
      <h1>설문조사</h1>
      { !isCompleted ? (
        <QuestionPage
        question={questions[currentQuestionIndex]}
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
        totalQuestions={questions.length}
        />
      ) : (
        <ResultPage
        questions={questions}
        answers={answers}
        textInputs={textInputs}
        onStartNew={handleStartNew}
        />
      ) }
    </div>
  );
}

export default App;