import Image from 'next/image'
import { Wallet } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 to-purple-700">
                <div className="absolute inset-0 bg-black/20" />
                <Image
                    src="/login-hero.png"
                    alt="Gestão de Carteiras"
                    fill
                    className="object-cover mix-blend-overlay"
                    priority
                />
                <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                    <div className="flex items-center gap-3 mb-8">
                        <Wallet className="h-10 w-10" />
                        <h1 className="text-3xl font-bold">Gestor de Carteiras</h1>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">
                        Gerencie seus investimentos com inteligência
                    </h2>
                    <p className="text-lg text-white/90 max-w-md">
                        Acompanhe sua carteira, analise performance, rebalanceie com facilidade e tome decisões baseadas em dados.
                    </p>
                    <div className="mt-12 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            <span className="text-white/90">Análise de performance em tempo real</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            <span className="text-white/90">Rebalanceamento inteligente</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-white rounded-full" />
                            <span className="text-white/90">Controle de proventos e dividendos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <Wallet className="h-8 w-8" />
                        <span className="text-xl font-bold">Gestor de Carteiras</span>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
