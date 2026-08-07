import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const logFilePath = path.join(process.cwd(), 'hipaa-audit.log');
        
        if (!fs.existsSync(logFilePath)) {
            return NextResponse.json({ logs: [] });
        }

        const logContent = fs.readFileSync(logFilePath, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim() !== '');

        // Parse lines (format: [TIMESTAMP] [STATUS] ACTION: action | TARGET: target | DETAILS: details)
        const parsedLogs = lines.map(line => {
            try {
                const timestampMatch = line.match(/^\[(.*?)\]/);
                const statusMatch = line.match(/\] \[(.*?)\]/);
                const actionMatch = line.match(/ACTION: (.*?) \|/);
                const targetMatch = line.match(/TARGET: (.*?) \|/);
                const detailsMatch = line.match(/DETAILS: (.*)$/);

                return {
                    timestamp: timestampMatch ? timestampMatch[1] : 'Unknown',
                    status: statusMatch ? statusMatch[1] : 'Unknown',
                    action: actionMatch ? actionMatch[1].trim() : 'Unknown',
                    target: targetMatch ? targetMatch[1].trim() : 'Unknown',
                    details: detailsMatch ? detailsMatch[1].trim() : line
                };
            } catch (e) {
                return { timestamp: 'Unknown', status: 'Unknown', action: 'Unknown', target: 'Unknown', details: line };
            }
        }).reverse(); // Newest first

        return NextResponse.json({ logs: parsedLogs });
    } catch (e: any) {
        console.error("GET /api/audit Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
