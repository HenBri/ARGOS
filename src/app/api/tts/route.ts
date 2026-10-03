import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tts
 * Body: { text: string, voice?: string }
 *
 * Calls ElevenLabs TTS API and returns raw MP3 audio.
 * Falls back to a 204 (no content) if API key is not set — the client
 * should then use the native SpeechSynthesis API.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;

    // If no API key configured → tell client to fall back to SpeechSynthesis
    if (!apiKey || apiKey.includes('Dummy') || apiKey.includes('placeholder')) {
      return NextResponse.json(
        { fallback: true, message: 'ELEVENLABS_API_KEY not configured, use SpeechSynthesis' },
        { status: 200 }
      );
    }

    const voiceId = voice || process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.slice(0, 5000), // ElevenLabs limit is typically 5000 chars per request
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
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

    const arrayBuffer = await ttsResponse.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

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
