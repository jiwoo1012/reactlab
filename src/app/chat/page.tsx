'use client'

import {Suspense, useState, useEffect, useRef} from 'react'
import {useSearchParams} from 'next/navigation'
import Cube from '../components/Cube'
import styles from './page.module.scss'

type ChatMessage = {
  name:string,
  message:string
}

const ChatContent = () => {
  const searchParams=useSearchParams()
  const [name, setName] = useState('')
  const [message, setMessage]=useState('')
  const [messages, setMessages]=useState<ChatMessage[]>([])

  const socketRef= useRef<WebSocket | null>(null)

  // 가장 최근 메시지로 자동 스크롤하기 위한 영역
  const messagesRef=useRef<HTMLDivElement | null>(null)

  // WebSocket은 브라우저 기본 기능이라 임포트하지 않아도 사용 가능.
  // socketRef 변수는 실제 웹소켓 연결을 위한 임의의 변수 : 웹 소켓 연결을 위한 보관함
  
  useEffect(()=>{
  // 소셜 로그인 이름 가져오기
  const socialName = searchParams.get('name') // name이라는 변수의 값을 가지고 옴

  if(socialName){
    localStorage.setItem('name', socialName)

    setName(socialName)

    // Header에게 로그인 상태가 바뀌었다고 알려줌
    window.dispatchEvent(
      new Event('auth-change')
    )

    return
  }


  // 일반 로그인 이름 가져오기
  const gName=localStorage.getItem('name')

  if(gName){
    queueMicrotask(() => setName(gName))
  }

},[searchParams])


  // 웹 소켓 서버 연결
  useEffect(()=>{
    // 이미 존재하는 (express에서 만들어진) WebSocket 서버에 접속
    const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  'ws://localhost:4000'

const socket = new WebSocket(WS_URL)
    socketRef.current=socket

    socket.onopen=()=>{
      console.log('채팅 서버 연결')
    }

    // 실시간 메시지 받기
    socket.onmessage=(e)=>{
      const data=JSON.parse(e.data)

      setMessages((item)=>[
        ...item,
        data
      ])
    }

    socket.onclose=()=>{
      console.log('채팅 서버 연결 종료')
    }

    return()=>{
      socket.close()
      socketRef.current=null
    }
  },[])


  // 새로운 메시지가 추가될 때마다
  // 채팅 영역을 가장 아래로 자동 이동
  useEffect(()=>{
    const container=messagesRef.current

    if(!container){
      return
    }

    const aniId=requestAnimationFrame(()=>{
      container.scrollTop=container.scrollHeight
    })

    return()=>{
      cancelAnimationFrame(aniId)
    }
  },[messages])


  // 실시간 메시지 보내기
  const sendMessage=()=>{
    if(!name.trim()){
      return
    }

    if(!message.trim()){
      return
    }

    if(socketRef.current?.readyState !== WebSocket.OPEN){
      return
    }

    const data:ChatMessage={
      name:name,
      message:message
    }

    socketRef.current?.send(
      JSON.stringify(data)
    )

    setMessage('')
  }


  return (
    <main className={styles.page}>
      <div className={styles.title}>
        <p>websochet chat</p>
        <h1>실시간 채팅</h1>
      </div>


      <div className={styles.cubeArea}>
        <Cube/>
      </div>


      <section className={styles.chatPanel}>
        <div className={styles.user}>
          접속 사용자: <strong>{name||'로그인 필요'}</strong>
        </div>


        {/* 실시간 채팅 메시지 */}
<div
  className={styles.messages}
  ref={messagesRef}
>
  {
    messages.map((item,index)=>(
      <div
        className={`${styles.message} ${
          item.name === name
            ? styles.myMessage
            : styles.otherMessage
        }`}
        key={index}
      >
        <strong>{item.name}</strong>
        <p>{item.message}</p>
      </div>
    ))
  }
</div>


        {/* 나의 메시지 입력 */}
        <div className={styles.inputArea}>
           <input
    type='text'
    placeholder='메시지를 입력하세요.'
    value={message}
    onChange={(e)=>setMessage(e.target.value)}
    onKeyDown={(e)=> {
      if(e.key === "Enter" && !e.nativeEvent.isComposing){
        sendMessage()
      }
    }}
  />

  <button
    type='button'
    className={styles.sendButton}
    onClick={sendMessage}
    aria-label='메시지 전송'
  >
    ↵
  </button>
</div>
      </section>
    </main>
  )
}


const ChatPage = () => {
  return (
    <Suspense fallback={<p>채팅 불러오는 중...</p>}>
      <ChatContent />
    </Suspense>
  )
}

export default ChatPage