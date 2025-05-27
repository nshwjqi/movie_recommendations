# 맞춤형 영화 추천 사이트 - 프로젝트 과제

주관식 답변이 가능한 사용자 맞춤형 영화 추천 사이트입니다.  
객관식 답변은 정적으로 맵핑한 조건이 적용되고, 주관식 답변은 ai를 이용해 사용자의 답변을 분석하여 조건을 추출합니다.  
이러한 조건을 필터링으로 하여 영화 DB /discover 쿼리로 조건에 맞는 영화를 찾습니다.  
조건을 점차 완화(제거)해가며 영화를 탐색하고, 끝까지 영화가 검색되지 않으면 인기 영화에서 랜덤 추천합니다.  

사용한 기술은 다음과 같습니다.  
JavaScript & React  
CI/CD : GitHub Actions (workflows.yml): Github Actions를 통해 빌드(node.js.yml) → 배포(CD.yml)  
Local Storage → Local Storage에 사용자의 응답 저장 → 사이트를 이탈했다가 재접속해도 설문 진행도 유지  
외부 API: TMDB API (영화 DB), OPENAI API (AI 언어 모델)  
Vercel Serverless Functions  
그외: 예외 처리  

