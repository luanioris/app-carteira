'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface RegistrarProventoParams {
    carteiraId: string
    ticker: string
    valor: number
    data: string
    reinvestido: boolean
}

export async function registrarProvento({ carteiraId, ticker, valor, data, reinvestido }: RegistrarProventoParams) {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    // Verificar permissão
    const { data: carteira } = await supabase
        .from('carteiras')
        .select('user_id')
        .eq('id', carteiraId)
        .single()

    if (!carteira || carteira.user_id !== user.id) {
        throw new Error('Sem permissão')
    }

    // Registrar provento
    const { error } = await supabase
        .from('proventos')
        .insert({
            carteira_id: carteiraId,
            ticker,
            valor,
            data,
            reinvestido
        })

    if (error) {
        console.error('Erro ao registrar provento:', error)
        throw new Error('Não foi possível registrar o provento')
    }

    revalidatePath(`/carteiras/${carteiraId}`)
}
