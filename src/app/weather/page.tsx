'use client'
// use client는 useState를 사용하기 때문에 꼭 넣어야 하는 친구.
// 근데 백 작업은 할 수 없음. use client 때문에. 따로 분리해서 작업해야 함.

import {useEffect, useRef, useState} from 'react'
import type {WeatherData, CitySuggestion} from '@/types/weather'
import styles from './page.module.scss'


const WeatherPage = () => {
  const [city, setCity]=useState('Seoul')
  const [loading,setLoading]=useState(false)
  const [weather, setWeather]=useState<WeatherData|null>(null)
  const [error,setError]=useState('')

  /*
    실제로 선택한 도시 이름

    날씨 API가 반환하는 name과
    검색한 도시 이름이 달라지는 문제 방지
  */
  const [resultCity,setResultCity]=useState('')


  const [suggestions,setSuggestions]=useState<CitySuggestion[]>([])
  const [showSuggestions,setShowSuggestions]=useState(false)
  const [suggestLoading,setSuggestLoading]=useState(false)
  const selectedCityRef=useRef<CitySuggestion|null>(null)
  const weatherRequestRef=useRef<AbortController|null>(null)

  useEffect(()=>()=>weatherRequestRef.current?.abort(),[])


  const cacheRef=useRef(
    new Map<string,CitySuggestion[]>()
  )


  // 도시 자동완성
  useEffect(()=>{
    const keyword=city.trim()
    let active=true


    /*
      Open-Meteo 도시 검색은
      2글자 이상부터 사용하는 것이 안정적
    */
    if(keyword.length < 2){
      queueMicrotask(()=>{
        if(!active) return
        setSuggestions([])
        setShowSuggestions(false)
        setSuggestLoading(false)
      })

      return()=>{active=false}
    }


    const cacheKey=
      keyword.toLowerCase()


    const cached=
      cacheRef.current.get(cacheKey)


    if(cached){
      queueMicrotask(()=>{
        if(!active) return
        setSuggestions(cached)
        setSuggestLoading(false)
      })

      return()=>{active=false}
    }


    const controller=
      new AbortController()

    queueMicrotask(()=>{
      if(!active) return
      setSuggestions([])
      setSuggestLoading(true)
    })


    const timer=setTimeout(async()=>{
      try{
        setSuggestLoading(true)


        const response=await fetch(
          `/api/city?q=${encodeURIComponent(keyword)}`,
          {
            signal:
              controller.signal
          }
        )


        if(!response.ok){
          if(active) setSuggestions([])

          return
        }


        const data:CitySuggestion[]=
          await response.json()

        if(!active) return


        cacheRef.current.set(
          cacheKey,
          data
        )


        setSuggestions(data)


      }catch(error){

        if(
          error instanceof Error &&
          error.name === 'AbortError'
        ){
          return
        }


        if(active) setSuggestions([])


      }finally{

        if(active) setSuggestLoading(false)
      }

    },80)


    return()=>{
      active=false
      clearTimeout(timer)

      controller.abort()
    }

  },[city])


  /*
    날씨 검색
  */
  const funWeather=async(
    selectedCity?:CitySuggestion
  )=>{

    const searchCity=
      city.trim()


    if(
      !selectedCity &&
      !searchCity
    ){
      return
    }

    weatherRequestRef.current?.abort()
    const controller=new AbortController()
    weatherRequestRef.current=controller


    try{
      setLoading(true)

      setError('')

      setWeather(null)

      setShowSuggestions(false)

      setSuggestions([])


      /*
        최종적으로 날씨를 조회할 도시
      */
      let targetCity:CitySuggestion
      const knownCity=selectedCity || selectedCityRef.current


      /*
        자동완성에서 클릭한 경우

        이미 정확한 도시와
        위도/경도를 알고 있음
      */
      if(knownCity){

        targetCity=
          knownCity

      }


      /*
        사용자가 직접 입력하고

        Enter 또는
        날씨 검색 버튼을 누른 경우
      */
      else{

        // 도시를 내가 따로 빼서 보내는 게 아니라 city라는 변수에 있을 거야. 
        // ?는 지금부터 조건이 있는데 city라는 속성이 있다는 걸 말함
        // encodeURIComponent: city 앞뒤로 띄어쓰기가 있다든지, 따옴표를 친다든지, !나 *를 쓴다든지..
        const cityRes=await fetch(
          `/api/city?q=${encodeURIComponent(searchCity)}`,
          {signal:controller.signal}
        )


        if(!cityRes.ok){
          throw new Error(
            '도시 검색 실패'
          )
        }


        const cityData:CitySuggestion[]=
          await cityRes.json()

        if(controller.signal.aborted) return


        if(cityData.length === 0){

          setError(
            '해당 도시를 찾을 수 없습니다.'
          )

          return
        }


        /*
          /api/city에서 이미

          이름 정확도
          도시 등급
          인구

          순으로 정렬했기 때문에
          첫 번째가 가장 적합한 결과
        */
        targetCity=
          cityData[0]
      }


      const targetName=
        targetCity.displayName ||
        targetCity.name

      selectedCityRef.current=targetCity


      /*
        검색창도
        실제 선택된 도시 이름으로 변경
      */
      setCity(targetName)


      /*
        결과 제목용 도시 이름
      */
      setResultCity(targetName)


      /*
        도시 이름으로 다시 검색하지 않고
        정확한 위도 / 경도로 날씨 조회
      */
      const res=await fetch(
        `/api/weather?lat=${targetCity.lat}&lon=${targetCity.lon}`,
        {signal:controller.signal}
      )


      if(!res.ok){
        throw new Error(
          '날씨 요청 실패'
        )
      }


      const data:WeatherData=
        await res.json()


      if(!controller.signal.aborted) setWeather(data)


    }catch{

      if(controller.signal.aborted) return

      setError(
        '날씨 정보를 가져오지 못했습니다.'
      )


    }finally{

      if(!controller.signal.aborted) setLoading(false)
    }
  }


  /*
    자동완성 클릭
    → 클릭 즉시 날씨 조회
  */
  const selectCity=(
    item:CitySuggestion
  )=>{
    funWeather(item)
  }


  return (
    <main className={styles.page}>

      <div className={styles.title}>
        <p>
          OPEN WEATHER API
        </p>

        <h2>
          현재 날씨
        </h2>

        <span>
          도시 이름을 입력하시면 도시의 현재 날씨를 알 수 있습니다.
        </span>
      </div>


      <section className={styles.panel}>

        <div className={styles.searchArea}>

          <label htmlFor="city">
            도시 검색
          </label>


          <form
            className={styles.searchBox}

            onSubmit={(e)=>{
              e.preventDefault()

              /*
                Enter로 검색
              */
              funWeather()
            }}
          >

            <div className={styles.inputArea}>

              <input
                id="city"

                type="text"

                placeholder='Seoul'

                value={city}

                autoComplete="off"

                onChange={(e)=>{
                  selectedCityRef.current=null
                  weatherRequestRef.current?.abort()
                  setLoading(false)
                  setSuggestions([])
                  setCity(
                    e.target.value
                  )

                  setShowSuggestions(true)
                }}

                onFocus={()=>{
                  if(
                    city.trim().length >= 2
                  ){
                    setShowSuggestions(true)
                  }
                }}

                onBlur={()=>{
                  setTimeout(()=>{
                    setShowSuggestions(false)
                  },150)
                }}
                onKeyDown={(e)=>{
                  if(e.key === 'Enter' && e.nativeEvent.isComposing){
                    e.preventDefault()
                  }
                }}
              />


              {
                showSuggestions &&
                city.trim().length >= 2 && (

                  <div
                    className={
                      styles.suggestions
                    }
                  >

                    {
                      suggestLoading &&
                      suggestions.length === 0 && (

                        <div
                          className={
                            styles.suggestLoading
                          }
                        >
                          도시 검색 중...
                        </div>

                      )
                    }


                    {
                      !suggestLoading &&
                      suggestions.length === 0 && (

                        <div
                          className={
                            styles.suggestLoading
                          }
                        >
                          검색 결과가 없습니다.
                        </div>

                      )
                    }


                    {
                      suggestions.map(
                        (item,index)=>(

                          <button
                            type="button"

                            className={
                              styles.suggestion
                            }

                            key={
                              `${item.name}-${item.country}-${item.lat}-${item.lon}-${index}`
                            }

                            onMouseDown={(e)=>{
                              /*
                                input blur보다
                                클릭을 먼저 처리
                              */
                              e.preventDefault()
                            }}
                            onClick={()=>selectCity(item)}
                          >

                            <span
                              className={
                                styles.searchIcon
                              }
                            >
                              ⌕
                            </span>


                            <div
                              className={
                                styles.cityText
                              }
                            >

                              <strong>
                                {
                                  item.displayName ||
                                  item.name
                                }
                              </strong>


                              {
                                item.state && (

                                  <span>
                                    {item.state}
                                  </span>

                                )
                              }

                            </div>


                            <span
                              className={
                                styles.country
                              }
                            >
                              {item.country}
                            </span>

                          </button>

                        )
                      )
                    }

                  </div>

                )
              }

            </div>


            <button
              type="submit"

              disabled={loading}
            >
              {
                loading
                  ? '검색 중..'
                  : '날씨 검색'
              }
            </button>

          </form>


          <p className={styles.hint}>
            Seoul, Tokyo, London 등 도시 이름을 입력해보세요.
          </p>

        </div>


        {
          error && (

            <div className={styles.error}>
              {error}
            </div>

          )
        }


        {
          weather && (

            <div
              className={
                styles.weatherResult
              }
            >

              <div
                className={
                  styles.weatherHeader
                }
              >

                <div>

                  <span
                    className={
                      styles.weatherLabel
                    }
                  >
                    CURRENT WEATHER
                  </span>


                  <h2>
                    {
                      resultCity ||
                      weather.name
                    }
                  </h2>


                  <p
                    className={
                      styles.description
                    }
                  >
                    {
                      weather
                        .weather[0]
                        .description
                    }
                  </p>

                </div>


                <div
                  className={
                    styles.temperature
                  }
                >

                  {
                    Math.round(
                      weather.main.temp
                    )
                  }

                  <span>
                    °C
                  </span>

                </div>

              </div>


              <div
                className={
                  styles.weatherInfo
                }
              >

                <div
                  className={
                    styles.infoCard
                  }
                >
                  <span>
                    현재 온도
                  </span>

                  <strong>
                    {
                      weather.main.temp
                    }
                    °C
                  </strong>
                </div>


                <div
                  className={
                    styles.infoCard
                  }
                >
                  <span>
                    풍속
                  </span>

                  <strong>
                    {
                      weather.wind.speed
                    } m/s
                  </strong>
                </div>


                <div
                  className={
                    styles.infoCard
                  }
                >
                  <span>
                    날씨 상태
                  </span>

                  <strong>
                    {
                      weather
                        .weather[0]
                        .description
                    }
                  </strong>
                </div>

              </div>

            </div>

          )
        }


        {
          !weather &&
          !error &&
          !loading && (

            <div className={styles.empty}>

              <div
                className={
                  styles.emptyIcon
                }
              >
                ☀
              </div>


              <strong>
                날씨가 궁금한 도시가 있나요?
              </strong>


              <p>
                도시를 검색하면 현재 온도와 날씨, 풍속 정보를 확인할 수 있습니다.
              </p>

            </div>

          )
        }

      </section>

    </main>
  )
}

export default WeatherPage
