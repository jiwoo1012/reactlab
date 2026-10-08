'use client'

import {useState} from 'react'
import {useRouter} from 'next/navigation'
import type { LoginResponse } from '@/types/auth'
import styles from './page.module.scss'


const LoginPage = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const fncLogin = async () => {
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/login`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username: username, password: password})
      })
      const data: LoginResponse = await response.json()
      if(!response.ok){
        setMessage(data.message)
        return
      }
      if(data.user){
        localStorage.setItem('name', data.user.name)
      }
      router.push('/chat')
    }catch{
      setMessage('서버에 연결할 수 없습니다.')
    }
  }

  const fncNaver = () => {
    window.location.assign(new URL('/auth/naver', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').href)
  }

  const fncKakao = () => {
    window.location.assign(new URL('/auth/kakao', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').href)
  }

  return (
    <main className={styles.page}>
      <div className={styles.loginWrapper}>
        <div className={styles.title}>
          <p>WELCOME BACK</p>
          <h1>로그인</h1>
          <span>
            계정에 로그인하고 서비스를 이용해보세요.
          </span>
        </div>

        <div className={styles.loginCard}>
          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">아이디</label>

              <input 
                id="username"
                type="text" 
                placeholder='아이디' 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">비밀번호</label>

              <input 
                id="password"
                type="password" 
                placeholder='비밀번호' 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button 
              className={styles.loginButton}
              onClick={fncLogin}
            >
              로그인
            </button>

            {message && (
              <p className={styles.message}>
                {message}
              </p>
            )}
          </div>

          <div className={styles.divider}>
            <span>또는</span>
          </div>

          <div className={styles.socialLogin}>
            <button 
              className={styles.naver}
              onClick={fncNaver}
            >
              <span className={styles.socialIcon}>N</span>
              네이버로 로그인
            </button>

            <button 
              className={styles.kakao}
              onClick={fncKakao}
            >
              <span className={styles.socialIcon}>K</span>
              카카오로 로그인
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default LoginPage
