'use client'

import {useEffect, useState} from 'react'
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation'
import styles from './Header.module.scss'

const Header = () => {
  const router = useRouter()
  const pathname = usePathname()

  const [name, setName] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)


  useEffect(()=>{
    const syncLogin = () => {
      const savedName = localStorage.getItem('name')

      setName(savedName || '')
    }

    syncLogin()

    window.addEventListener('storage', syncLogin)
    window.addEventListener('auth-change', syncLogin)

    return()=>{
      window.removeEventListener('storage', syncLogin)
      window.removeEventListener('auth-change', syncLogin)
    }
  },[pathname])


  // 페이지 이동 시 메뉴 닫기
  useEffect(()=>{
    setMenuOpen(false)
  },[pathname])


  const fncLogout = () => {
    localStorage.removeItem('name')

    setName('')

    window.dispatchEvent(
      new Event('auth-change')
    )

    setMenuOpen(false)

    router.push('/')
  }


  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>

        <div className={styles.menuArea}>

          <div
            className={`${styles.mainNav} ${
              menuOpen
                ? styles.mainNavOpen
                : ''
            }`}
          >
            <Link
              href="/"
              className={styles.logo}
            >
              React Lab
            </Link>


            {
              !menuOpen ? (
                <>
                  <nav className={styles.nav}>
                    <Link href="/">
                      Home
                    </Link>

                    <Link href="/study">
                      AI Study
                    </Link>

                    <Link href="/weather">
                      Weather
                    </Link>

                    <Link href="/chat">
                      Chat
                    </Link>
                  </nav>

                  <button
                    type="button"
                    className={styles.moreButton}
                    aria-label="메뉴 열기"
                    onClick={()=>setMenuOpen(true)}
                  >
                    ⋮
                  </button>
                </>
              ) : (
                <div className={styles.openControls}>
                  <button
                    type="button"
                    className={styles.closeButton}
                    onClick={()=>setMenuOpen(false)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className={styles.moreButton}
                    aria-label="메뉴 닫기"
                    onClick={()=>setMenuOpen(false)}
                  >
                    ⋮
                  </button>
                </div>
              )
            }
          </div>


          {/* 펼쳐지는 메뉴 */}
          <div
            className={`${styles.menuPanel} ${
              menuOpen
                ? styles.menuPanelOpen
                : ''
            }`}
          >
            <div className={styles.menuLinks}>

              <Link
                href="/study"
                className={styles.menuItem}
              >
                <div
                  className={`${styles.menuIcon} ${styles.studyIcon}`}
                >
                  ?
                </div>

                <div className={styles.menuText}>
                  <strong>AI Study</strong>

                  <span>
                    질문하고 학습하기
                  </span>
                </div>

                <span className={styles.arrow}>
                  ↗
                </span>
              </Link>


              <Link
                href="/weather"
                className={styles.menuItem}
              >
                <div
                  className={`${styles.menuIcon} ${styles.weatherIcon}`}
                >
                  ☀
                </div>

                <div className={styles.menuText}>
                  <strong>Weather</strong>

                  <span>
                    도시의 현재 날씨 확인하기
                  </span>
                </div>

                <span className={styles.arrow}>
                  ↗
                </span>
              </Link>


              <Link
                href="/chat"
                className={styles.menuItem}
              >
                <div
                  className={`${styles.menuIcon} ${styles.chatIcon}`}
                >
                  •••
                </div>

                <div className={styles.menuText}>
                  <strong>Chat</strong>

                  <span>
                    실시간으로 메시지 주고받기
                  </span>
                </div>

                <span className={styles.arrow}>
                  ↗
                </span>
              </Link>

            </div>


            {/* 로그인 영역 */}
            <div className={styles.menuBottom}>
              {
                name ? (
                  <>
                    <div className={styles.bottomUser}>
                      <span className={styles.userDot}></span>

                      <strong>
                        {name}
                      </strong>

                      <span>
                        님
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.bottomLogout}
                      onClick={fncLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={styles.bottomLogin}
                    >
                      Login
                    </Link>

                    <Link
                      href="/signup"
                      className={styles.bottomSignup}
                    >
                      Sign up
                    </Link>
                  </>
                )
              }
            </div>
          </div>
        </div>


        {/* 오른쪽 로그인 상태 */}
        {
          name ? (
            <div className={styles.userNav}>
              <div className={styles.userName}>
                <span className={styles.userDot}></span>

                <strong>
                  {name}
                </strong>

                <span>
                  님
                </span>
              </div>

              <button
                type="button"
                className={styles.logout}
                onClick={fncLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authNav}>
              <Link
                href="/login"
                className={styles.login}
              >
                Login
              </Link>

              <Link
                href="/signup"
                className={styles.signup}
              >
                Get started
              </Link>
            </div>
          )
        }

      </div>
    </header>
  )
}

export default Header