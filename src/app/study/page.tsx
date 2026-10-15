'use client'

import {useRef, useState} from 'react'
import { studyData } from '@/data/studyData'
import type { AiRequest, AiResponse, Studymode } from '@/types/study'
import styles from './page.module.scss'

// 프론트에서 사용자에게 질문을 받아서 서버에게 보낸다(jsx, tsx, html) -> 서버(route.ts, java, node)가 openai에게 질문을 던진다.
// 서버(route.ts, java, node)가 openai에게 답변을 받는다 -> 서버가 프론트에게 답변을 보내준다.

/* openai 활용 시
  프론트 (html, react)에서 유저에게 data를 받는다 ->
  서버에게 전송(로컬): 내 서버에게 ->
  로컬 서버가 openai에게 data를 전송하고 응답을 받는다 ->
  로컬 서버가 프론트에게 받은 응답을 다시 전송해준다.
*/

const StudyPage = () => {
  // const abc : string = 'hong'
  const [mode, setMode]=useState<Studymode>('explain')
  // useState라는 명령이 들어왔을 때는 <>로 값을 알려줘야 값이 제대로 들어감(ts에 적힌 explain 스펠링 정확하게)
  
  // 값을 받을 변수가 필요함. 그래서 만들어줌 -> message
  const [message, setMessage] = useState('')  // 사용자의 질문

  const [answer, setAnswer]= useState('')     // 답변
  const [loading, setLoading]=useState(false)
  const [quizAnswer, setQuizAnswer]=useState('')  // AI가 만들어낸 퀴즈
  const [showAnswer, setShowAnswer] = useState(false) // AI가 만든 퀴즈의 답변이 있으면 보여주고, 그렇지 않으면 감추는 역할
  const [previousQuestions, setPreviousQuestions]=useState<string[]>([])
  const [currentQuiz, setCurrentQuiz]=useState('')
  const [hint, setHint] = useState('')
  const [error, setError] = useState('')
  const requestInProgress = useRef(false)
  const actionLabel = mode === 'quiz' ? '퀴즈 만들기' : mode === 'hint' ? '힌트 받기' : '설명 받기'

  const funcquiz=async(requestMode: Studymode = mode)=>{
    if(requestInProgress.current) return
    setError('')
    if(requestMode !== 'hint' && !message.trim()){
      setError('질문이나 학습 주제를 입력해주세요.')
      return
    }

    if(requestMode === 'hint' && !currentQuiz){
      setError('먼저 퀴즈를 출제해주세요.')
      return
    }

    try{
      requestInProgress.current = true
      setLoading(true)
      const response=await fetch('/api/ai/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          message,
          mode: requestMode,
          currentQuiz,
          previousQuestions // 이전 퀴즈 전달
        } satisfies AiRequest)
      })

      const data: AiResponse & { message?: string } = await response.json()
      if(!response.ok){
        throw new Error(data.message || 'AI 요청 실패')
      }
      if(typeof data.answer !== 'string' || !data.answer.trim()){
        throw new Error('답변을 생성하지 못했습니다. 다시 시도해주세요.')
      }
      if(requestMode==='quiz'){
        if(typeof data.questionAns !== 'string' || !data.questionAns.trim()){
          throw new Error('정답을 받지 못했습니다. 다시 문제를 만들어주세요.')
        }
        setCurrentQuiz(data.answer)
        setQuizAnswer(data.questionAns)
        setShowAnswer(false)
        setHint('')
        setPreviousQuestions((prev)=> [...prev,data.answer].slice(-10))
      } else if(requestMode === 'hint'){
        setHint(data.answer)
      } else {
        setAnswer(data.answer)
      }
    }catch(err){
      setError(err instanceof Error ? err.message : 'AI 답변을 가져오지 못했습니다.')
    }finally{
      requestInProgress.current = false
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <p>OpenAI API 활용</p>
        <h1>React 학습</h1>
        <span>학습 방식을 선택하고 질문을 입력하세요</span>
      </div>
      <section className={styles.panel}>
        <h2>학습 방법</h2>
        <div className={styles.modes}>
        {
          studyData.map((item)=>(
            <button className={styles.mode} aria-pressed={mode === item.mode} key={item.id} disabled={loading} onClick={()=>{setMode(item.mode); setError('')}}>
              <strong>
                {item.title}
              </strong>
              <p>{item.description}</p>
            </button>
          ))
        }
        </div>
        <div className={styles.question}>
        <label htmlFor='message'>{mode === 'hint' ? '추가 질문 (선택)' : '질문 또는 학습 주제'}</label>
        <textarea id='message' value={message} disabled={loading} onChange={(e)=>setMessage(e.target.value)}
          placeholder={mode === 'hint' ? '비워두어도 현재 퀴즈의 힌트를 받을 수 있어요' : '예시: useState'} />
        </div>

          <button className={styles.submit} onClick={()=>funcquiz()} disabled={loading} aria-busy={loading}>
            {loading ? '답변 생성 중…' : actionLabel}
          </button>
          {mode === 'hint' && !currentQuiz && <p>먼저 ‘문제 만들기’를 선택해 퀴즈를 만들어주세요.</p>}
        </section>

          {error && <div className={styles.answer} role="alert"><p>{error}</p></div>}
          {loading && <p className={styles.status} role="status">AI가 답변을 준비하고 있어요…</p>}
          {
            mode === 'explain' && answer&&(
            <div className={styles.answer} role='status'>
              <h2>개념 설명</h2>
              <p>{answer}</p>
            </div>
            )
          }
          {currentQuiz && (
            <section className={styles.answer} aria-label="현재 퀴즈">
              <h2>현재 퀴즈</h2>
              <p>{currentQuiz}</p>
              <div className={styles.quizActions}>
                <button disabled={loading} onClick={()=>setShowAnswer(prev=>!prev)} aria-expanded={showAnswer} aria-controls="quiz-answer">
                  {showAnswer ? '정답 숨기기' : '정답 보기'}
                </button>
                <button disabled={loading} onClick={()=>funcquiz('hint')}>힌트 받기</button>
              </div>
              {showAnswer && <div id="quiz-answer" className={styles.detail}><h3>정답 및 해설</h3><p>{quizAnswer}</p></div>}
              {hint && <div className={styles.detail} aria-live="polite"><h3>힌트</h3><p>{hint}</p></div>}
            </section>
          )}
    </main>
  )
}

export default StudyPage
