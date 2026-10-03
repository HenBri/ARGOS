import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 *
 * Calls Google Cloud TTS API and returns raw MP3 audio.
 * Falls back to a 204 (no content) if API key is not set — the client
 * should then use the native SpeechSynthesis API.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    // If no API key configured → tell client to fall back to SpeechSynthesis
    if (!apiKey || apiKey.includes('Dummy') || apiKey.includes('placeholder')) {
      return NextResponse.json(
        { fallback: true, message: 'GOOGLE_TTS_API_KEY not configured, use SpeechSynthesis' },
        { status: 200 }
      );
    }

    const voiceId = voice || process.env.NEXT_PUBLIC_DEFAULT_VOICE_ID || 'es-US-Studio-B';
    const speakingRate = speed || parseFloat(process.env.NEXT_PUBLIC_VOICE_SPEED || '1.05');

    const ttsResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.slice(0, 5000) }, // Google Cloud TTS limit
          voice: {
            languageCode: 'es-US',
            name: voiceId,
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate,
            pitch: 0.0,
            effectsProfileId: ['small-bluetooth-speaker-class-device'],
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('[TTS API Error]', errText);
      // Return fallback signal so client uses SpeechSynthesis
      return NextResponse.json({ fallback: true, message: errText }, { status: 200 });
    }

    const ttsData = await ttsResponse.json();
    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[TTS Route Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS error' },
      { status: 500 }
    );
  }
}
