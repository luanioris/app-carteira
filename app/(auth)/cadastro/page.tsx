'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup } from '../actions'

export default function SignupPage() {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await signup(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Conta criada com sucesso!')
            }
        })
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
                <CardDescription>
                    Preencha os dados abaixo para começar a gerenciar seus investimentos
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Seu nome"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" type="submit" disabled={isPending}>
                        {isPending ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                        Já tem uma conta?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Entrar
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
