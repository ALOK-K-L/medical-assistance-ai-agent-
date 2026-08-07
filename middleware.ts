import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle ngrok free-tier interstitial page issues
// and ensure API routes are accessible from external services like VAPI
export function middleware(request: NextRequest) {
    // Log all incoming requests for debugging
    console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);

    // For API routes, ensure proper CORS and bypass headers
    if (request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname.startsWith('/chat/')) {
        
        // Handle CORS preflight
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

        // Continue to the route handler, adding CORS headers to the response
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', '*');
        // Tell ngrok to skip the browser warning for responses
        response.headers.set('ngrok-skip-browser-warning', 'true');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/chat/:path*'],
};
