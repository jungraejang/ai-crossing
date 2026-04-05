import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Simulation API is running',
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case 'save':
        return NextResponse.json({ status: 'saved', timestamp: Date.now() });
      case 'load':
        return NextResponse.json({ status: 'loaded', timestamp: Date.now() });
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Simulation API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
