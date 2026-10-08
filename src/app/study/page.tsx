'use client'

import {useState} from 'react'
import { studyData } from '@/data/studyData'
import type { AiResponse, Studymode } from '@/types/study'
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
  const [message, setMessage] = useState('')

  const [answer, setAnswer]= useState('')
  const [loading, setLoading]=useState(false)

  const funcquiz=async()=>{
    if(!message.trim()){
      return
    }
    try{
      setLoading(true)
      setAnswer('')
      const response=await fetch('/api/ai/', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          message,
          mode
        })
      })

      if(!response.ok){
        throw new Error('AI 요청 실패')
      }
      const data: AiResponse=await response.json()
      setAnswer(data.answer)

    }catch{
      setAnswer('AI 답변을 가져오지 못했습니다.')
    }finally{
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
            <button className={styles.mode} aria-pressed={mode === item.mode} key={item.id} onClick={()=>setMode(item.mode)}>
              <strong>
                {item.title}
              </strong>
              <p>{item.description}</p>
            </button>
          ))
        }
        </div>
        <div className={styles.question}>
        <label htmlFor='message'>질문</label>
        <textarea id='message' value={message} onChange={(e)=>setMessage(e.target.value)}
          placeholder='예시: useState를 쉽게 설명해줘' />
        </div>

          <button className={styles.submit} onClick={funcquiz} disabled={loading} aria-busy={loading}>
            {loading ? '답변 생성 중' : '질문하기'}
          </button>
        </section>

          {
            answer&&(
            <div className={styles.answer} role='status'>
              <h2>AI 답변</h2>
              <p>{answer}</p>
            </div>
            )
          }
    </main>
  )
}

export default StudyPage
