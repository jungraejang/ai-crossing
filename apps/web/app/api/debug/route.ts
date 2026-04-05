import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    aiProvider: process.env.AI_PROVIDER || 'ollama',
    model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
  });
}
