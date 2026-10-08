export type WeatherData = {
    name: string

    main:{
        temp: number
    }

    weather: {
        main: string
        description: string
    }[]

    wind:{
        speed: number
    }
}


export type CitySuggestion = {
    name: string
    displayName?: string
    country: string
    state?: string
    lat: number
    lon: number
}