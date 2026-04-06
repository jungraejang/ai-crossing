import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    lmStudioUrl: process.env.LMSTUDIO_URL || 'http://127.0.0.1:1234',
    aiProvider: process.env.AI_PROVIDER || 'lmstudio',
    model: process.env.LMSTUDIO_MODEL || 'default',
  });
}
