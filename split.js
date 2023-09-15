import { WaveFile } from "https://code4fukui.github.io/wavefile-es/index.js";
import { subWave } from "./subWave.js";
import { fixnum } from "https://js.sabae.cc/Num.js";

if (Deno.args.length == 0) {
  console.log("deno run -A split.js [src wav file] (silence gap sec)");
  Deno.exit(1);
}
const fn = Deno.args[0];
const silencegapsec = parseFloat(Deno.args[1] || "0.5");

const sec2count = (wav, sec) => Math.floor(sec * wav.fmt.sampleRate);

const wav = new WaveFile();
wav.fromBuffer(await Deno.readFile(fn));
console.log(wav.fmt);

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
        end = i - nzero;
      }
    } else {
      cnt = 0;
    }
  } else {
    if (w != 0) {
      const len = end - start;
      await writeWave(idx, start, len);
      cnt = 0;
      start = i;
      idx++;
      state = 0;
    }
  }
}
if (end > start) {
  await writeWave(idx, start, end - start);
}