'use client'

import {useState} from 'react'
import styles from './page.module.scss'

const SignupPage = () => {
    const [name, setName] = useState('')    
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [message, setMessage] = useState('')
    
    const fncSignup = async () => {
        if(!name.trim() || !username.trim() || !password.trim()){
            setMessage('모든 항목을 입력해주세요.')
            return
        }

        try{
            const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/signup`, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({name: name, username: username, password: password})
            })
            const data=await response.json()
            setMessage(data.message)
            if(response.ok){
                setName(''); setUsername(''); setPassword('')
            }

        }catch{
            setMessage('회원가입 중 오류가 발생했습니다.')
        }
    }

  return (
    <main className={styles.page}>
        <div className={styles.signupWrapper}>
            <div className={styles.title}>
                <p>JOIN US</p>
                <h1>회원가입</h1>
                <span>
                    계정을 만들고 다양한 서비스를 이용해보세요.
                </span>
            </div>

            <div className={styles.signupCard}>
                <div className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name">닉네임</label>

                        <input 
                            id="name"
                            type="text" 
                            placeholder='닉네임' 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>

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
                        className={styles.signupButton}
                        onClick={fncSignup}
                    >
                        회원가입
                    </button>

                    {message && (
                        <p className={styles.message}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    </main>
  )
}

export default SignupPage
