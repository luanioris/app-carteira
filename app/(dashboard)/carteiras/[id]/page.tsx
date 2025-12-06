import { Suspense } from 'react'
import { CarteiraSkeleton } from '@/components/skeletons/carteira-skeleton'
import { CarteiraContent } from './carteira-content'

export default async function CarteiraDetalhePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    return (
        <Suspense fallback={<CarteiraSkeleton />}>
            <CarteiraContent id={params.id} />
        </Suspense>
    )
}
