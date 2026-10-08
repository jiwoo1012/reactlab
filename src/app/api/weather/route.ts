export const GET = async(request:Request)=>{
    // finally는 백 작업에서는 필요 없음

    try{
        // city 가져오기
        //    /api/weather?city=${encodeURIComponent(city)&lot(위도)={33.5}&apikey={apikey}}

        const {searchParams} = new URL(request.url)

        const city=searchParams.get('city') // 사용자가 입력을 두드리는 거

        // 자동완성에서 선택한 도시의 위도, 경도
        const lat=searchParams.get('lat')
        const lon=searchParams.get('lon')


        /*
            도시 이름도 없고
            위도/경도도 없는 경우
        */
        if(!city && (!lat || !lon)){
            return Response.json(
                {
                    message:'도시를 입력하세요.'
                },
                {
                    status:400
                }
            )
        }


        const apikey=process.env.OPENWEATHER_API_KEY


        /*
            OpenWeather API 주소

            직접 입력:
            city 사용

            자동완성 선택:
            lat / lon 사용
        */
        let weatherUrl=''


        // 자동완성에서 도시를 선택한 경우
        if(lat && lon){

            weatherUrl=
                `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apikey}&units=metric&lang=kr`

        }else if(city){

            // 직접 도시 이름을 입력한 경우
            weatherUrl=
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apikey}&units=metric&lang=kr`

        }


        const res=await fetch(weatherUrl)


        if(!res.ok){
            return Response.json(
                {
                    message:'날씨 정보를 받지 못했습니다.'
                },
                {
                    status:404
                }
            )
        }


        const data = await res.json()

        return Response.json(data)


    }catch{

        return Response.json(
            {
                message:'날씨 요청 중에 오류가 발생했습니다.'
            },
            {
                status:500
            }
        )
    }
}