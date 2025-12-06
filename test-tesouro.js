require('dotenv').config({ path: '.env.local' });

const BRAPI_BASE_URL = 'https://brapi.dev/api'
const TOKEN = process.env.BRAPI_API_TOKEN

async function testTesouroTickers() {
    if (!TOKEN) {
        console.error('ERRO: BRAPI_API_TOKEN não encontrado')
        return
    }

    // Possíveis formatos de ticker para Tesouro Direto
    const possiveisTickers = [
        'LFT2031',
        'LFT 2031',
        'LFT-2031',
        'LFT2029',
        'LFT 2029',
        'LFT-2029',
        'TESOURO-SELIC-2031',
        'TESOURO-SELIC-2029'
    ]

    console.log('Testando tickers do Tesouro Direto...\n')

    for (const ticker of possiveisTickers) {
        const url = `${BRAPI_BASE_URL}/quote/${ticker}?fundamental=false&token=${TOKEN}`
        try {
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                if (data.results && data.results.length > 0) {
                    console.log(`✅ ENCONTRADO: ${ticker}`)
                    console.log(`   Nome: ${data.results[0].longName || data.results[0].shortName}`)
                    console.log(`   Preço: R$ ${data.results[0].regularMarketPrice}`)
                    console.log('')
                }
            } else {
                console.log(`❌ Não encontrado: ${ticker}`)
            }
        } catch (e) {
            console.log(`❌ Erro ao buscar: ${ticker}`)
        }
    }
}

testTesouroTickers()
