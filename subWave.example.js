import { WaveFile } from "https://code4fukui.github.io/wavefile-es/index.js";
import { subWave } from "./subWave.js";

const wav = new WaveFile();
wav.fromBuffer(await Deno.readFile("long.wav"));
console.log(wav.fmt);

const sec2count = (sec) => Math.floor(sec * wav.fmt.sampleRate);;
const offset = 5;
const timesec = 10;
const wav2 = subWave(wav, sec2count(offset), sec2count(timesec));
await Deno.writeFile("sub.wav", wav2.toBuffer());
