import { inflateSync } from 'node:zlib';

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Decode a non-interlaced 8-bit RGBA PNG. Used to sample alpha without a native image library. */
export function decodeRgbaPng(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('not a png');
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const chunks = [];
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    offset += 4;
    const type = buf.toString('ascii', offset, offset + 4);
    offset += 4;
    const data = buf.subarray(offset, offset + length);
    offset += length + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[10] !== 0) {
        throw new Error(`unsupported png ihdr ${data[8]}/${data[9]}/${data[10]}`);
      }
      colorType = data[9];
    } else if (type === 'IDAT') {
      chunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (colorType !== 6) throw new Error('png is not rgba');
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const out = Buffer.alloc(height * stride);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source];
    source += 1;
    const row = y * stride;
    for (let i = 0; i < stride; i += 1) {
      const value = raw[source];
      source += 1;
      const left = i >= 4 ? out[row + i - 4] : 0;
      const up = y > 0 ? out[row - stride + i] : 0;
      const upLeft = y > 0 && i >= 4 ? out[row - stride + i - 4] : 0;
      let next = value;
      if (filter === 1) next = (value + left) & 255;
      else if (filter === 2) next = (value + up) & 255;
      else if (filter === 3) next = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) next = (value + paeth(left, up, upLeft)) & 255;
      else if (filter !== 0) throw new Error(`png filter ${filter}`);
      out[row + i] = next;
    }
  }
  return {
    width,
    height,
    pixel(x, y) {
      const i = (y * width + x) * 4;
      return [out[i], out[i + 1], out[i + 2], out[i + 3]];
    },
  };
}

export function pngSize(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
