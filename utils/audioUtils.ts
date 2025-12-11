export const PCM_SAMPLE_RATE = 16000;
export const OUTPUT_SAMPLE_RATE = 24000;

export interface PcmBlob {
  data: string;
  mimeType: string;
}

/**
 * Converts Float32Array audio data to the format expected by Gemini Live API (PCM Int16).
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, s, true);
  }
  return buffer;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): PcmBlob {
  const pcmData = floatTo16BitPCM(data);
  const base64 = arrayBufferToBase64(pcmData);
  return {
    data: base64,
    mimeType: `audio/pcm;rate=${PCM_SAMPLE_RATE}`,
  };
}

export async function decodeAudioData(
  arrayBuffer: ArrayBuffer,
  ctx: AudioContext
): Promise<AudioBuffer> {
    // We manually decode assuming 1 channel PCM 16-bit at 24kHz (Model output standard)
    // However, the helper in the guide shows a specific manual decoding loop if raw PCM is sent without header.
    // The Gemini Live API sends raw PCM 16-bit little-endian.
    
    const dataInt16 = new Int16Array(arrayBuffer);
    const numChannels = 1;
    const frameCount = dataInt16.length / numChannels;
    
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, OUTPUT_SAMPLE_RATE);
    
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            // Normalize Int16 to Float32 (-1.0 to 1.0)
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return audioBuffer;
}
