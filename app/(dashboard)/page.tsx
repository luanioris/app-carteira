import { Suspense } from 'react'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { DashboardContent } from './dashboard-content'

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}
