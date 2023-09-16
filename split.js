import { WaveFile } from "https://code4fukui.github.io/wavefile-es/index.js";
import { subWave } from "./subWave.js";
import { fixnum } from "https://js.sabae.cc/Num.js";

if (Deno.args.length == 0) {
  console.log("deno run -A split.js [src wav file] (silence gap sec)");
  Deno.exit(1);
}
const fn = Deno.args[0];
const silencegapsec = parseFloat(Deno.args[1] || "0.1");

const sec2count = (wav, sec) => Math.floor(sec * wav.fmt.sampleRate);

const wav = new WaveFile();
wav.fromBuffer(await Deno.readFile(fn));
if (wav.fmt.numChannels != 2) {
  throw new Error("only spported 2 channels");
}
if (wav.fmt.bitsPerSample != 16) {
  throw new Error("only spported 16 bit");
}
//console.log(wav.fmt);

const sfn = fn.substring(0, fn.length - 4) + "_";

const ss = wav.data.samples;
const wavs = new Int16Array(ss.length / 4);
const b2i16 = (b1, b2) => {
  const n = b1 + (b2 << 8);
  if (n > 32767) {
    return n - 65556;
  }
  return n;
};
for (let i = 0; i < wavs.length; i++) {
  const w1 = b2i16(ss[i * 4], ss[i * 4 + 1]);
  const w2 = b2i16(ss[i * 4 + 2], ss[i * 4 + 3]);
  const w = (w1 + w2) / 2;
  wavs[i] = w;
}

const writeWave = async (idx, offset, len) => {
  const wav2 = subWave(wav, offset, len);
  const fn = sfn + fixnum(idx, 3) + ".wav";
  console.log(fn, offset, len);
  await Deno.writeFile(fn, wav2.toBuffer());
};

const nzero = sec2count(wav, silencegapsec);
let cnt = 0;
let idx = 0;
let start = 0;
let end = 0;
let state = 0; // 0: wait zero, 1: 
for (let i = 0; i < wavs.length; i++) {
  const w = wavs[i];
  if (state == 0) {
    if (w == 0) {
      cnt++;
      if (cnt == nzero) {
        state = 1;
        end = i - (nzero - 1);
      }
    } else {
      cnt = 0;
    }
  } else {
    if (w != 0) {
      const len = end - start;
      if (len > 0) {
        await writeWave(idx, start, len);
        idx++;
      }
      cnt = 0;
      start = i;
      state = 0;
    }
  }
}
if (end > start) {
  await writeWave(idx, start, end - start);
} else if (start == 0 && end == 0) {
  await writeWave(idx, 0, wavs.length);
} else {
  await writeWave(idx, start, wavs.length - start);
}
