// Tipos da API brapi.dev
export type BrapiQuote = {
    symbol: string
    shortName: string
    longName: string
    currency: string
    regularMarketPrice: number
    regularMarketDayHigh: number
    regularMarketDayLow: number
    regularMarketDayRange: string
    regularMarketChange: number
    regularMarketChangePercent: number
    regularMarketTime: string
    marketCap: number
    regularMarketVolume: number
    regularMarketPreviousClose: number
    regularMarketOpen: number
    averageDailyVolume10Day: number
    averageDailyVolume3Month: number
    fiftyTwoWeekLowChange: number
    fiftyTwoWeekLowChangePercent: number
    fiftyTwoWeekRange: string
    fiftyTwoWeekHighChange: number
    fiftyTwoWeekHighChangePercent: number
    fiftyTwoWeekLow: number
    fiftyTwoWeekHigh: number
    twoHundredDayAverage: number
    twoHundredDayAverageChange: number
    twoHundredDayAverageChangePercent: number
    priceEarnings: number
    earningsPerShare: number
    logourl: string
}

export type BrapiResponse = {
    results: BrapiQuote[]
    requestedAt: string
    took: string
}

export type BrapiSearchResult = {
    symbol: string
    name: string
    type: string
}
