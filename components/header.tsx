import Link from 'next/link'
import { LogOut, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signout } from '@/app/(auth)/actions'
import { createClient } from '@/lib/supabase/server'
import { NavLink } from './nav-link'
import { ModeToggle } from './mode-toggle'

export async function Header() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const userName = user?.user_metadata?.name || 'Usuário'
    const userEmail = user?.email || ''
    const userInitials = userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Wallet className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            Gestor de Carteiras
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <NavLink href="/">Dashboard</NavLink>
                        <NavLink href="/carteiras">Carteiras</NavLink>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search placeholder if needed */}
                    </div>
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={userName} />
                                    <AvatarFallback>{userInitials}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {userEmail}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <form action={signout}>
                                <button className="w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 flex">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </button>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
