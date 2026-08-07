export const dynamic = 'force-dynamic';
import { POST as ChatPOST, GET as ChatGET } from '../../../chat/route';

export async function POST(req: Request) {
    return ChatPOST(req);
}

export async function GET(req: Request) {
    return ChatGET(); // ChatGET does not take arguments
}
