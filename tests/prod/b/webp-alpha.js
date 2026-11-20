import { readFile } from 'node:fs/promises';
import { initEmscriptenModule } from './vendor/webp/utils.js';
import webpDec from './vendor/webp/webp_dec.js';

let ready;

function decoder() {
  ready ??= (async () => {
    const wasm = await readFile(new URL('./vendor/webp/webp_dec.wasm', import.meta.url));
    const compiled = await WebAssembly.compile(wasm);
    return initEmscriptenModule(webpDec, compiled);
  })();
  return ready;
}

/** Count fully transparent pixels in a WebP buffer. */
export async function transparentRatio(bytes) {
  const decoded = await (await decoder()).decode(bytes);
  const data = decoded.data;
  const pixels = decoded.width * decoded.height;
  let transparent = 0;
  for (let i = 0; i < pixels; i += 1) {
    if (data[i * 4 + 3] === 0) transparent += 1;
  }
  return {
    width: decoded.width,
    height: decoded.height,
    transparent,
    pixels,
    ratio: pixels === 0 ? 0 : transparent / pixels,
  };
}
