import { Header } from '@/components/header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-8 py-8">{children}</main>
        </div>
    )
}
