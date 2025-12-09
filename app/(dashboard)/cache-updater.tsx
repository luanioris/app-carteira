'use client'

import { useEffect } from 'react'
import { verificarEAtualizarCache } from './actions-cache'

export function CacheUpdater() {
    useEffect(() => {
        // Dispara a verificação e atualização do cache em background assim que o dashboard monta.
        // Se houver atualizações, a action fará um revalidatePath, atualizando a UI automaticamente.
        verificarEAtualizarCache().then(res => {
            if (res?.atualizados && res.atualizados > 0) {
                console.log(`[CacheUpdater] ${res.atualizados} cotações atualizadas.`)
            }
        })
    }, [])

    return null
}
