import type { NextRequest } from 'next/server';

export function createAiGatewayHandler() {
  return async function handler(req: NextRequest) {
    // TODO: Implement AI integration proxy
    return new Response(JSON.stringify({ status: 'ok', message: 'AI gateway handler' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
