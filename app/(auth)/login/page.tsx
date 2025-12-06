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
import { login } from '../actions'

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await login(formData)
            if (result?.error) {
                toast.error(result.error)
            }
        })
    }

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
                <CardDescription>
                    Digite seu email e senha para acessar suas carteiras
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
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
                        <Input id="password" name="password" type="password" required />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-6">
                    <Button className="w-full" type="submit" disabled={isPending}>
                        {isPending ? 'Entrando...' : 'Entrar'}
                    </Button>
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                        Não tem uma conta?{' '}
                        <Link
                            href="/cadastro"
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Cadastre-se
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
