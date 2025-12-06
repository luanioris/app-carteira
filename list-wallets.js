const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function listWallets() {
    const { data: carteiras } = await supabase
        .from('carteiras')
        .select('id, nome')

    console.table(carteiras)
}

listWallets()
