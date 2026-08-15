/**
 * Load the ESM-only file-type package from the CommonJS NestJS application.
 * NodeNext keeps this dynamic import intact in the compiled output.
 */
export async function detectFileType(buffer: Uint8Array) {
  const { fileTypeFromBuffer } = await import('file-type');
  return fileTypeFromBuffer(buffer);
}
