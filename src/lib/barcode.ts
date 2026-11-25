/** Generate a unique shop barcode: ES + zero-padded sequence */
export function generateShopBarcode(sequence: number): string {
  return `ES${String(sequence).padStart(10, "0")}`;
}

export function generateSku(sequence: number): string {
  return `SKU-${String(sequence).padStart(6, "0")}`;
}
