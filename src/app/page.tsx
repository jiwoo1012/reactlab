import { studyData } from '@/data/studyData'
import StudyCard from './components/StudyCard'
import Link from 'next/link'
import HomeHero from './components/HomeHero'
import styles from './page.module.scss'

const Home = () => {
  return (
    <main className={styles.page}>
      {/* Hero */}
      <HomeHero />

      {/* Dark intro band */}
      <section className={styles.introBand}>
        <div className={styles.introInner}>
          <div className={styles.miniStat}>
            <span>01</span>

            <p>
              AI를 활용한
              <br />
              React 학습
            </p>
          </div>

          <div className={styles.introTitle}>
            <p>
              Learn, ask, and practice.
            </p>

            <h2>
              직접 해보며 배우는 학습
            </h2>
          </div>

          <div className={styles.miniStat}>
            <span>02</span>

            <p>
              외부 API를 활용한
              <br />
              실전 데이터 경험
            </p>
          </div>
        </div>
      </section>

      {/* AI Concept */}
      <section
        className={`
          ${styles.featureSection}
          ${styles.conceptSection}
        `}
      >
        <div
          className={styles.conceptVisual}
          aria-hidden="true"
        >
          <div className={styles.gridCircle}>
            <div className={styles.axisX}></div>
            <div className={styles.axisY}></div>
            <div className={styles.vectorLine}></div>

            <div className={styles.vectorPoint}>
              <span></span>
            </div>

            <div className={styles.angleShape}></div>
          </div>
        </div>

        <div className={styles.featureCopy}>
          <p className={styles.sectionLabel}>
            OPENAI
          </p>

          <h2>
            Concepts
            <br />
            that click.
          </h2>

          <p>
            단순히 정답을 확인하는 대신,
            원하는 학습 방식을 선택하고
            AI에게 직접 질문하며 개념을
            이해할 수 있습니다.
          </p>

          <Link
            href="/study"
            className={styles.textLink}
          >
            AI 학습 시작하기
            <span>↗</span>
          </Link>
        </div>
      </section>

      {/* Study */}
      <section className={styles.studySection}>
        <div className={styles.studyIntro}>
          <p className={styles.sectionLabel}>
            AI STUDY
          </p>

          <h2>
            Learn at
            <br />
            your level.
          </h2>

          <p>
            원하는 학습 방식을 골라
            질문하고 답변을 확인해보세요.
          </p>
        </div>

        <div className={styles.studyContent}>
          <div className={styles.levelLabel}>
            <span>
              Choose your way
            </span>

            <div></div>
          </div>

          <div className={styles.studyGrid}>
            {studyData.map((item) => (
              <StudyCard
                key={item.id}
                item={item}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section
        className={`
          ${styles.featureSection}
          ${styles.flowSection}
        `}
      >
        <div className={styles.flowCopy}>
          <p className={styles.sectionLabel}>
            LEARNING FLOW
          </p>

          <h2>
            Guided,
            <br />
            bite-sized
            <br />
            learning.
          </h2>

          <p>
            질문에서 끝나는 것이 아니라
            개념을 이해하고 직접 적용해보는
            흐름을 경험합니다.
          </p>
        </div>

        <div
          className={styles.flowVisual}
          aria-hidden="true"
        >
          <div className={styles.flowPath}></div>

          <div
            className={`
              ${styles.flowNode}
              ${styles.nodeOne}
            `}
          >
            <span>01</span>
            <strong>Ask</strong>
          </div>

          <div
            className={`
              ${styles.flowNode}
              ${styles.nodeTwo}
            `}
          >
            <span>02</span>
            <strong>Learn</strong>
          </div>

          <div
            className={`
              ${styles.flowNode}
              ${styles.nodeThree}
            `}
          >
            <span>03</span>
            <strong>Try</strong>
          </div>
        </div>
      </section>

      {/* Weather */}
      <section
        className={`
          ${styles.featureSection}
          ${styles.weatherSection}
        `}
      >
        <div
          className={styles.weatherVisual}
          aria-hidden="true"
        >
          <div className={styles.weatherOrbit}></div>

          <div className={styles.sun}>
            <span>☀</span>
          </div>

          <div className={styles.weatherCard}>
            <span>SEOUL</span>
            <strong>24°</strong>
            <p>Current weather</p>
          </div>
        </div>

        <div className={styles.featureCopy}>
          <p className={styles.sectionLabel}>
            OPENWEATHER API
          </p>

          <h2>
            Learn APIs
            <br />
            by doing.
          </h2>

          <p>
            OpenWeather API를 활용해 실제 데이터를 요청하고,
            도시별 현재 날씨와 온도,
            풍속 정보를 확인합니다.
          </p>

          <div className={styles.techList}>
            <span>Next.js</span>
            <span>Tailwind CSS</span>
            <span>OpenWeather API</span>
          </div>

          <Link
            href="/weather"
            className={styles.textLink}
          >
            날씨 API 확인하기
            <span>↗</span>
          </Link>
        </div>
      </section>

      {/* Tech */}
      <section className={styles.techBand}>
        <p>
          BUILT WITH
        </p>

        <h2>
          Modern tools for hands-on learning.
        </h2>

        <div className={styles.techNames}>
          <span>Next.js</span>
          <span>React</span>
          <span>OpenAI</span>
          <span>TypeScript</span>
          <span>OpenWeather</span>
        </div>
      </section>

      {/* Journey */}
      <section className={styles.journey}>
        <div className={styles.journeyHeader}>
          <p className={styles.sectionLabel}>
            NEXT PROJECT
          </p>

          <h2>
            Explore the project.
          </h2>
        </div>

        <div className={styles.journeyGrid}>
          <Link
            href="/study"
            className={styles.journeyCard}
          >
            <div className={styles.journeyNumber}>
              01
            </div>

            <div>
              <span>
                AI STUDY
              </span>

              <h3>
                AI와 함께 React 학습하기
              </h3>

              <p>
                학습 방식을 선택하고 질문을 입력해
                AI 답변을 확인합니다.
              </p>
            </div>

            <strong>↗</strong>
          </Link>

          <Link
            href="/weather"
            className={styles.journeyCard}
          >
            <div className={styles.journeyNumber}>
              02
            </div>

            <div>
              <span>
                WEATHER API
              </span>

              <h3>
                실시간 날씨 데이터 확인하기
              </h3>

              <p>
                도시를 검색해 OpenWeather API의
                실시간 데이터를 확인합니다.
              </p>
            </div>

            <strong>↗</strong>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalDecorOne}></div>
        <div className={styles.finalDecorTwo}></div>

        <div className={styles.finalContent}>
          <p>
            NEXT · REACT · AI
          </p>

          <h2>
            Start your
            <br />
            learning journey.
          </h2>

          <span>
            직접 질문하고 실습하며 React를 학습해보세요.
          </span>

          <Link
            href="/study"
            className={styles.ctaButton}
          >
            Get started
            <strong>→</strong>
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Home