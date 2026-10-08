import {NextRequest, NextResponse} from 'next/server'


type GeoCity = {
    id:number
    name:string
    latitude:number
    longitude:number

    feature_code?:string

    country_code?:string
    country?:string

    admin1?:string
    admin2?:string

    population?:number
}


/*
    도시 이름 비교용

    서울특별시 -> 서울
    인천광역시 -> 인천
    수원시 -> 수원

    Seoul City -> seoul
*/
const normalizeCityName=(value:string)=>{
    return value
        .toLowerCase()
        .replace(/\s/g,'')
        .replace(/-/g,'')
        .replace(
            /(특별자치도|특별자치시|특별시|광역시|자치시|자치도|시|군|구|도)$/g,
            ''
        )
        .replace(
            /(metropolitancity|specialcity|city)$/g,
            ''
        )
}


/*
    도시의 중요도

    PPLC  = 국가 수도
    PPLA  = 주요 행정도시
    PPLA2 = 행정도시
    PPL   = 일반 도시/지역
*/
const getFeatureScore=(featureCode?:string)=>{
    switch(featureCode){
        case 'PPLC':
            return 50000000

        case 'PPLA':
            return 40000000

        case 'PPLA2':
            return 30000000

        case 'PPLA3':
            return 20000000

        case 'PPLA4':
            return 10000000

        case 'PPL':
            return 5000000

        default:
            return 0
    }
}


export async function GET(request:NextRequest){
    const {searchParams}=new URL(request.url)

    const query=searchParams
        .get('q')
        ?.trim()


    if(!query){
        return NextResponse.json([])
    }


    /*
        한글이 들어왔으면 한국어 결과
        영어가 들어왔으면 영어 결과
    */
    const isKorean=/[가-힣]/.test(query)

    const language=
        isKorean
            ? 'ko'
            : 'en'


    try{
        /*
            8개만 바로 받지 않고
            넉넉하게 받은 뒤

            우리가 직접 정확도를 판단한다.
        */
        // 두 글자 검색은 정확히 등록된 이름만 찾으므로 정식 행정명도 검색한다.
        // language=ko는 결과 표시 언어이며 검색어를 번역하는 옵션은 아니다.
        const searchNames=new Set([query])
        if(/^[가-힣\s]+$/.test(query)){
            const base=normalizeCityName(query)
            if(base.length >= 2){
                searchNames.add(base)
                for(const suffix of ['시','광역시','특별시','특별자치시','군']){
                    searchNames.add(`${base}${suffix}`)
                }
            }
        }

        const responses=await Promise.allSettled(
            Array.from(searchNames,async(name)=>{
                const response=await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=100&language=${language}&format=json`,
                    {cache:'no-store'}
                )
                if(!response.ok){
                    throw new Error('도시 검색 실패')
                }
                const data:{results?:GeoCity[]}=await response.json()
                return data.results || []
            })
        )
        const resultsById=new Map<number,GeoCity>()
        let succeeded=false
        for(const response of responses){
            if(response.status === 'fulfilled'){
                succeeded=true
                for(const item of response.value){
                    resultsById.set(item.id,item)
                }
            }
        }
        if(!succeeded){
            throw new Error('도시 검색 실패')
        }
        const results=Array.from(resultsById.values())


        const normalizedQuery=
            normalizeCityName(query)


        /*
            도시 형태의 결과를 우선 사용

            PPLC
            PPLA
            PPLA2
            PPL
            ...
        */
        const cityResults=
            results.filter((item)=>{
                return (
                    item.feature_code?.startsWith('PPL')
                )
            })


        /*
            만약 도시 결과가 하나도 없으면
            원래 결과 사용
        */
        const targets=
            cityResults.length > 0
                ? cityResults
                : results

        // 국내 행정도시와 이름이 같은 일반 취락을 도시 후보로 섞지 않는다.
        // 광주광역시와 경기도 광주시처럼 서로 다른 행정도시는 모두 유지한다.
        const isAdministrativeCity=(item:GeoCity)=>
            /^(PPLC|PPLA\d*)$/.test(item.feature_code || '') ||
            (/(시|군)$/.test(item.name) && item.name === item.admin2)
        const hasExactAdministrativeCity=targets.some((item)=>
            item.country_code === 'KR' && isAdministrativeCity(item) &&
            normalizeCityName(item.name) === normalizedQuery
        )
        const compactQuery=query.replace(/\s/g,'')
        const hasExplicitCitySuffix=
            /(?:특별자치시|특별시|광역시|시|군)$/.test(compactQuery)
        const filteredTargets=targets.filter((item)=>{
            if(item.country_code !== 'KR') return true

            const normalizedName=normalizeCityName(item.name)
            if(hasExplicitCitySuffix && normalizedName === normalizedQuery &&
                item.name.replace(/\s/g,'') !== compactQuery){
                return false
            }

            return !hasExactAdministrativeCity ||
                (normalizedName === normalizedQuery && isAdministrativeCity(item))
        })


        /*
            검색 결과 점수 계산
        */
        const scored=filteredTargets.map((item)=>{

            const normalizedName=
                normalizeCityName(item.name)


            let matchScore=0


            /*
                완전히 같은 도시 이름

                Seoul === Seoul
                인천 === 인천광역시
            */
            if(
                normalizedName ===
                normalizedQuery
            ){
                matchScore=1000000000
            }


            /*
                검색어로 시작
            */
            else if(
                normalizedName.startsWith(
                    normalizedQuery
                )
            ){
                matchScore=500000000
            }


            /*
                이름 안에 포함
            */
            else if(
                normalizedName.includes(
                    normalizedQuery
                )
            ){
                matchScore=100000000
            }


            const featureScore=
                getFeatureScore(
                    item.feature_code
                )


            const populationScore=
                item.population || 0


            return {
                ...item,

                score:
                    matchScore +
                    featureScore +
                    populationScore
            }
        })


        /*
            점수가 높은 도시부터 정렬

            같은 이름이면
            수도/광역도시/인구 많은 도시가 위로 올라옴
        */
        scored.sort(
            (a,b)=>b.score-a.score
        )


        /*
            같은 이름 + 같은 지역이
            여러 번 나오는 것 제거
        */
        const unique=new Map<
            string,
            typeof scored[number]
        >()


        scored.forEach((item)=>{

            const key=
                `${normalizeCityName(item.name)}-${normalizeCityName(item.admin1 || '')}-${item.country_code || ''}`


            if(!unique.has(key)){
                unique.set(
                    key,
                    item
                )
            }
        })


        /*
            화면에는 최대 8개만 표시
        */
        const cities=
            Array
                .from(unique.values())
                .slice(0,8)
                .map((item)=>({
                    name:item.name,

                    displayName:item.name,

                    country:
                        item.country || '',

                    state:
                        item.admin1,

                    lat:
                        item.latitude,

                    lon:
                        item.longitude
                }))


        return NextResponse.json(
            cities
        )


    }catch{

        return NextResponse.json(
            {
                message:
                    '도시 정보를 가져오지 못했습니다.'
            },
            {
                status:500
            }
        )
    }
}
