import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
    console.log('🚀 Executando migration de notas...')

    const migration = `
        -- Adicionar campo de notas na tabela carteiras
        ALTER TABLE carteiras 
        ADD COLUMN IF NOT EXISTS notas TEXT;
    `

    try {
        const { error } = await supabase.rpc('exec_sql', { sql: migration })

        if (error) {
            console.error('❌ Erro na migration:', error)
            process.exit(1)
        }

        console.log('✅ Migration executada com sucesso!')
    } catch (err) {
        console.error('❌ Erro:', err)
        process.exit(1)
    }
}

runMigration()
