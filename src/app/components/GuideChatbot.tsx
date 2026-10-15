'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './GuideChatbot.module.scss'
type ChatMessage = {
    role : 'user' | 'assistant'
    content: string
}

const GuideChatbot = () => {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState<ChatMessage[]>([
        {
            role : 'assistant',
            content : '안녕하세요! React 학습 도우미입니다. useState, props, JSX 등 궁금한 React 개념을 질문해주세요.'
        }
    ])
    const [loading, setLoading] = useState(false)
    const [question, setQuestion] = useState('')

    const messageRef = useRef<HTMLDivElement | null>(null)    

    //질문이나 답변이 추가되면 맨 아래로 이동
    useEffect (()=>{
        if(messageRef.current){
            messageRef.current.scrollTop = messageRef.current.scrollHeight
        }
    },[message, loading, open])

    const handleSend = async()=> {
        if(!question.trim() || loading) return
        // input에서 받은 question 을 사용자라는 role붙여 사용하기
        const userMessage: ChatMessage = {
            role: 'user',
            content: question.trim(),
        };

        setMessage((prev) => [...prev, userMessage]);
        setQuestion('')
        setLoading(true)

        // 서버로 (guide/route.ts) 요청 :: 사용자 질문을 받아서 openAi 에게 보내고 받는 역할
        try{
            const response = await fetch('/api/guide', {
                method :'POST',
                headers : {'Content-Type' : 'application/json'},
                body : JSON.stringify({
                    question : userMessage.content
                })
            })

            const data = await response.json()

            if(!response.ok){
                throw new Error(data.error || '답변 요청 실패')
            }

            const botMessage:ChatMessage = {
                role : 'assistant',
                content : data.answer || '답변을 생성하지 못했습니다'
            }

            setMessage((prev) => [...prev, botMessage]);
        }catch(err){
            console.error('React 학습 챗봇 오류', err)
            setMessage((prev) => [...prev, {role : 'assistant', content : '오류가 발생했습니다, 다시 질문해주세요'}]);
            
        }finally{
            setLoading(false)
        }
    }
  return (
    <aside className={styles.chatbot} aria-label="React 학습 챗봇">
        {
            open && (
                <section className={styles.panel} id="guide-chatbot-panel" aria-labelledby="guide-chatbot-title">
                    <div className={styles.header}>
                        <div>
                            <span className={styles.eyebrow}>REACT AI STUDY</span>
                            <h3 id="guide-chatbot-title">React 학습 도우미</h3>
                        </div>
                        <button className={styles.closeButton} onClick={() => setOpen(false)} aria-label="학습 도우미 닫기">×</button>
                    </div>
                    <div className={styles.messages} ref={messageRef} role="log" aria-live="polite" aria-label="대화 내용">
                        {
                            message.map((item,index) => (
                                <p key={index} className={item.role === 'user' ? styles.userMessage : styles.answer}>
                                    {item.content}
                                </p>
                            ))
                        }
                        {loading && <p className={styles.status}>답변을 준비하고 있어요…</p>}
                    </div>
                        <div className={styles.inputArea}>
                            <input type="text" aria-label="React 학습 질문" placeholder='예: useState는 어떻게 사용하나요?'
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.nativeEvent.isComposing){
                                    handleSend()      
                                }
                            }}
                            disabled = {loading}
                            />
                            <button onClick={handleSend} disabled={loading || !question.trim()}> {loading ? '대기중' : '전송'}</button>
                        </div>
                </section>
            )
        }
        <button className={styles.toggleButton} onClick={()=> setOpen(!open)} aria-expanded={open} aria-controls="guide-chatbot-panel">
            <span aria-hidden="true">{open ? '×' : '✦'}</span>
            {open ? '도우미 닫기' : 'React 학습 도우미'}
        </button>
    </aside>
  )
}

export default GuideChatbot


