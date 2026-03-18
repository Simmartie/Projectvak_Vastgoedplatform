import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Rewrite /agenda/:userId.ics → /api/agenda/:userId
    // Google Calendar requires the URL to end in .ics
    const icsMatch = pathname.match(/^\/agenda\/(.+)\.ics$/)
    if (icsMatch) {
        const userId = icsMatch[1]
        const url = request.nextUrl.clone()
        url.pathname = `/api/agenda/${userId}`
        url.search = ''
        return NextResponse.rewrite(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/agenda/:path*.ics'],
}
