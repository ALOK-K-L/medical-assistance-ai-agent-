import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);

    if (request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname.startsWith('/chat/')) {
        
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                },
            });
        }

        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', '*');
        response.headers.set('ngrok-skip-browser-warning', 'true');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/chat/:path*'],
};
