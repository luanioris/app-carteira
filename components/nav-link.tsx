'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({
    href,
    children,
}: {
    href: string
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            className={
                isActive
                    ? 'text-foreground'
                    : 'text-foreground/60 transition-colors hover:text-foreground/80'
            }
        >
            {children}
        </Link>
    )
}
