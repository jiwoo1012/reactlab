'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './HomeHero.module.scss'

const clamp = (value: number) => {
  return Math.min(Math.max(value, 0), 1)
}

const easeOut = (value: number) => {
  return 1 - Math.pow(1 - value, 3)
}

const easeInOut = (value: number) => {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

const HomeHero = () => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let animationFrame = 0

    const updateProgress = () => {
      const section = sectionRef.current

      if (!section) return

      const rect = section.getBoundingClientRect()

      const scrollDistance =
        section.offsetHeight - window.innerHeight

      if (scrollDistance <= 0) {
        setProgress(0)
        return
      }

      const currentProgress = clamp(
        -rect.top / scrollDistance
      )

      setProgress(currentProgress)
    }

    const handleScroll = () => {
      cancelAnimationFrame(animationFrame)

      animationFrame = requestAnimationFrame(
        updateProgress
      )
    }

    updateProgress()

    window.addEventListener(
      'scroll',
      handleScroll,
      { passive: true }
    )

    window.addEventListener(
      'resize',
      handleScroll
    )

    return () => {
      cancelAnimationFrame(animationFrame)

      window.removeEventListener(
        'scroll',
        handleScroll
      )

      window.removeEventListener(
        'resize',
        handleScroll
      )
    }
  }, [])

  /*
    ==============================
    01. 제목 퇴장
    ==============================

    스크롤 초반에 React Lab이
    위로 올라가면서 사라짐.
  */

  const textExitProgress = easeInOut(
    clamp((progress - 0.04) / 0.11)
  )

  const textOpacity =
    1 - textExitProgress

  const textY =
    textExitProgress * -210


  /*
    ==============================
    02. 아이콘 순차 상승
    ==============================

    왼쪽부터 하나씩 올라감.
    마지막 아이콘까지 도착하기 전에는
    축소하지 않음.
  */

  const iconStarts = [
    0.12,
    0.22,
    0.32,
    0.42,
    0.52
  ]

  const iconLiftValues =
    iconStarts.map((start) => {
      const localProgress = clamp(
        (progress - start) / 0.12
      )

      return easeOut(localProgress)
    })

  /*
    화면 아래에서
    화면 중앙 부근까지 올라갈 거리
  */

  const liftDistance = 31


  /*
    ==============================
    03. 축소 + 중앙 집결
    ==============================

    마지막 아이콘까지 다 올라온 뒤
    0.70부터 축소 시작.
  */

  const shrinkProgress = easeInOut(
    clamp((progress - 0.70) / 0.18)
  )

  /*
    100% → 34%
  */

  const iconScale =
    1 - shrinkProgress * 0.66

  /*
    처음:
    10 / 30 / 50 / 70 / 90vw

    마지막:
    약 38 / 44 / 50 / 56 / 62vw

    즉 하나로 겹치는 게 아니라
    작은 아이콘 5개가 중앙에 한 줄로 모임.
  */

  const horizontalMoves = [
    28,
    14,
    0,
    -14,
    -28
  ]


  const getIconStyle = (
    index: number
  ) => {
    const y =
      iconLiftValues[index] *
      liftDistance

    const x =
      horizontalMoves[index] *
      shrinkProgress

    return {
      transform: `
        translate3d(
          ${x}vw,
          -${y}vh,
          0
        )
        scale(${iconScale})
      `
    }
  }

  return (
    <section
      ref={sectionRef}
      className={styles.heroScroll}
    >
      <div className={styles.sticky}>
        {/* HERO TEXT */}
        <div
          className={styles.heroText}
          style={{
            opacity: textOpacity,

            transform: `
              translate3d(
                -50%,
                ${textY}px,
                0
              )
            `,

            pointerEvents:
              textOpacity < 0.1
                ? 'none'
                : 'auto'
          }}
        >
        

          <h1>React Lab</h1>

          <p className={styles.description}>
            Next.js를 기반으로 AI 학습 기능과 외부 API를 활용해
            <br />
            직접 질문하고, 확인하고, 실습하며 배우는 React 학습 프로젝트입니다.
          </p>

          <Link
            href="/study"
            className={styles.startButton}
          >
            Get started
            <span>→</span>
          </Link>
        </div>

        {/* ICON ROW */}
        <div className={styles.iconRow}>
          {/* 01 */}
          <div
            className={`${styles.icon} ${styles.question}`}
            style={getIconStyle(0)}
          >
            <span>?</span>
          </div>

          {/* 02 */}
          <div
            className={`${styles.icon} ${styles.code}`}
            style={getIconStyle(1)}
          >
            <span>&lt;/&gt;</span>
          </div>

          {/* 03 */}
          <div
            className={`${styles.icon} ${styles.ai}`}
            style={getIconStyle(2)}
          >
            <div className={styles.aiFace}>
              <i />
              <i />
            </div>
          </div>

          {/* 04 */}
          <div
            className={`${styles.icon} ${styles.weather}`}
            style={getIconStyle(3)}
          >
            <div className={styles.sun} />
          </div>

          {/* 05 */}
          <div
            className={`${styles.icon} ${styles.chat}`}
            style={getIconStyle(4)}
          >
            <div className={styles.chatBubble}>
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeHero