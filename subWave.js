import { WaveFile } from "https://code4fukui.github.io/wavefile-es/index.js";

export const subWave = (wav, noffset, nlen) => {
  const wav2 = new WaveFile();
  const org = wav.data.samples;
  const ch = wav.fmt.numChannels;
  const samples = new Int16Array(nlen * ch);
  const off = noffset * ch;
  for (let i = 0; i < nlen * ch; i++) {
    const n = (off + i) * 2;
    samples[i] = org[n] + (org[n + 1] << 8);
  }
  wav2.fromScratch(wav.fmt.numChannels, wav.fmt.sampleRate, wav.fmt.bitsPerSample, samples);
  return wav2;
};
