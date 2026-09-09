const UTF8_BOM = [0xef, 0xbb, 0xbf];

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

export function decodeQuestionFile(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const payload = startsWith(bytes, UTF8_BOM) ? bytes.slice(UTF8_BOM.length) : bytes;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(payload);
  } catch {
    try {
      return new TextDecoder("gb18030", { fatal: true }).decode(payload);
    } catch {
      return new TextDecoder("utf-8").decode(payload);
    }
  }
}
