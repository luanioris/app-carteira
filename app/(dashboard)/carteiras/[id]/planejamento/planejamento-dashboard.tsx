'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, Target, Calculator, TrendingUp, Save } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface PlanejamentoDashboardProps {
    carteira: any
    metaInicial: any
    valorAtual: number
}

export function PlanejamentoDashboard({ carteira, metaInicial, valorAtual }: PlanejamentoDashboardProps) {
    const router = useRouter()
    const supabase = createClient()

    // Estados da Meta
    const [objetivoPatrimonio, setObjetivoPatrimonio] = useState<string>(metaInicial?.objetivo_patrimonio?.toString() || '')
    const [dataAlvo, setDataAlvo] = useState<string>(metaInicial?.data_alvo || '')
    const [loading, setLoading] = useState(false)

    // Estados do Simulador
    const [aporteMensal, setAporteMensal] = useState<number>(1000)
    const [taxaAnual, setTaxaAnual] = useState<number>(10) // 10% a.a.
    const [anos, setAnos] = useState<number>(10)

    // Calcular projeção
    const projecao = useMemo(() => {
        const dados = []
        let saldo = valorAtual
        let totalInvestido = valorAtual
        const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1

        for (let ano = 0; ano <= anos; ano++) {
            dados.push({
                ano: new Date().getFullYear() + ano,
                saldo: saldo,
                investido: totalInvestido,
                juros: saldo - totalInvestido
            })

            // Avançar 12 meses
            for (let i = 0; i < 12; i++) {
                saldo = saldo * (1 + taxaMensal) + aporteMensal
                totalInvestido += aporteMensal
            }
        }
        return dados
    }, [valorAtual, aporteMensal, taxaAnual, anos])

    // Salvar Meta
    const handleSalvarMeta = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('metas')
                .upsert({
                    carteira_id: carteira.id,
                    objetivo_patrimonio: parseFloat(objetivoPatrimonio),
                    data_alvo: dataAlvo || null
                }, { onConflict: 'carteira_id' })

            if (error) throw error
            toast.success('Meta salva com sucesso!')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar meta.')
        } finally {
            setLoading(false)
        }
    }

    // Calcular progresso da meta
    const progresso = useMemo(() => {
        if (!objetivoPatrimonio) return 0
        const alvo = parseFloat(objetivoPatrimonio)
        if (alvo <= 0) return 0
        return Math.min((valorAtual / alvo) * 100, 100)
    }, [valorAtual, objetivoPatrimonio])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/carteiras/${carteira.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Planejamento</h1>
                        <p className="text-muted-foreground">{carteira.nome}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Definição de Metas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Definir Objetivos
                        </CardTitle>
                        <CardDescription>Estabeleça onde você quer chegar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Patrimônio Alvo (R$)</Label>
                            <Input
                                type="number"
                                value={objetivoPatrimonio}
                                onChange={(e) => setObjetivoPatrimonio(e.target.value)}
                                placeholder="Ex: 1000000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Alvo (Opcional)</Label>
                            <Input
                                type="date"
                                value={dataAlvo}
                                onChange={(e) => setDataAlvo(e.target.value)}
                            />
                        </div>

                        {/* Barra de Progresso */}
                        {objetivoPatrimonio && (
                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progresso Atual</span>
                                    <span className="font-bold">{progresso.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${progresso}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {parseFloat(objetivoPatrimonio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSalvarMeta} disabled={loading} className="w-full">
                            <Save className="mr-2 h-4 w-4" />
                            {loading ? 'Salvando...' : 'Salvar Meta'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Parâmetros do Simulador */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Simulador de Aportes
                        </CardTitle>
                        <CardDescription>Simule o crescimento do seu patrimônio</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Aporte Mensal</Label>
                                <span className="font-bold text-blue-600">R$ {aporteMensal.toLocaleString('pt-BR')}</span>
                            </div>
                            <Slider
                                value={[aporteMensal]}
                                onValueChange={(v: number[]) => setAporteMensal(v[0])}
                                max={50000}
                                step={100}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Taxa Anual (%)</Label>
                                <span className="font-bold text-green-600">{taxaAnual}%</span>
                            </div>
                            <Slider
                                value={[taxaAnual]}
                                onValueChange={(v: number[]) => setTaxaAnual(v[0])}
                                max={30}
                                step={0.5}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Período (Anos)</Label>
                                <span className="font-bold">{anos} anos</span>
                            </div>
                            <Slider
                                value={[anos]}
                                onValueChange={(v: number[]) => setAnos(v[0])}
                                max={50}
                                step={1}
                            />
                        </div>

                        <div className="pt-4 p-4 bg-muted/50 rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Patrimônio Estimado em {new Date().getFullYear() + anos}</p>
                            <p className="text-3xl font-bold text-primary">
                                R$ {projecao[projecao.length - 1].saldo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Projeção */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Projeção Futura
                    </CardTitle>
                    <CardDescription>Evolução do patrimônio com juros compostos</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={projecao} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="ano" />
                            <YAxis
                                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                            />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip
                                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="saldo"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorSaldo)"
                                name="Patrimônio Total"
                            />
                            <Area
                                type="monotone"
                                dataKey="investido"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorInvestido)"
                                name="Total Investido"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
