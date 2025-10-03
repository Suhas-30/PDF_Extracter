import { NextRequest, NextResponse } from 'next/server';

// Proxy to Modal backend to avoid CORS in the browser
const UPSTREAM = 'https://suhashs1813688815--nxtgen-pdf-extracter-backend-create-app.modal.run/extract';

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();

    // Expect: model and one file per request
    const model = incoming.get('model');
    const file = incoming.get('file');

    if (typeof model !== 'string' || !(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid payload: require model and file' }, { status: 400 });
    }

    const fd = new FormData();
    fd.append('model', model);
    fd.append('file', file, file.name);

    const upstreamRes = await fetch(UPSTREAM, {
      method: 'POST',
      body: fd,
      // No CORS headers needed here; this runs server-side
    });

    const contentType = upstreamRes.headers.get('content-type') || '';

    if (!upstreamRes.ok) {
      if (contentType.includes('application/json')) {
        const j = await upstreamRes.json();
        return NextResponse.json(j, { status: upstreamRes.status });
      }
      const t = await upstreamRes.text();
      return new NextResponse(t, { status: upstreamRes.status });
    }

    if (contentType.includes('application/json')) {
      const j = await upstreamRes.json();
      return NextResponse.json(j);
    }
    const t = await upstreamRes.text();
    return new NextResponse(t, { headers: { 'content-type': contentType || 'text/plain' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Extraction proxy failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}