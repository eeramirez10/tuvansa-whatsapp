// src/domain/services/product-stream-parser.service.ts
export type ProductoParsed = {
  ean: string;
  descripcion: string;
  unidad: string;
};

type ProductosState = {
  productos: Record<number, ProductoParsed>;
  productosEnviados: Set<number>;
  currentIdx: number | null;
};

const EAN_LINE_REGEX =
  /^\s*(\d+)\S*\s+ean\s*[:=-]?\s*(.+?)\s*$/i;

const FIELD_LINE_REGEX =
  /^\s*(descripci[oó]n|unidad)\s*[:=-]?\s*(.+?)\s*$/i;

export class ProductStreamParser {
  private state: ProductosState = {
    productos: {},
    productosEnviados: new Set<number>(),
    currentIdx: null,
  };

  processLine(line: string): { isProductLine: boolean; completedIndex: number | null } {
    const { productos, productosEnviados } = this.state;

    // 1) EAN con número
    let match = line.match(EAN_LINE_REGEX);
    if (match) {
      const idx = Number(match[1]);
      const eanValue = match[2].trim();

      this.state.currentIdx = idx;

      if (!productos[idx]) {
        productos[idx] = { ean: '', descripcion: '', unidad: '' };
      }

      const prod = productos[idx];
      const antesCompleto = !!(prod.ean && prod.descripcion && prod.unidad);

      prod.ean = eanValue;

      const ahoraCompleto = !!(prod.ean && prod.descripcion && prod.unidad);

      if (!antesCompleto && ahoraCompleto && !productosEnviados.has(idx)) {
        return { isProductLine: true, completedIndex: idx };
      }

      return { isProductLine: true, completedIndex: null };
    }

    // 2) Descripción / Unidad
    match = line.match(FIELD_LINE_REGEX);
    if (!match) return { isProductLine: false, completedIndex: null };

    if (this.state.currentIdx == null) {
      return { isProductLine: false, completedIndex: null };
    }

    const idx = this.state.currentIdx;
    const campo = match[1].toLowerCase();
    const valor = match[2].trim();

    if (!productos[idx]) {
      productos[idx] = { ean: '', descripcion: '', unidad: '' };
    }

    const prod = productos[idx];
    const antesCompleto = !!(prod.ean && prod.descripcion && prod.unidad);

    if (campo.startsWith('descripci')) prod.descripcion = valor;
    else if (campo.startsWith('unidad')) prod.unidad = valor;

    const ahoraCompleto = !!(prod.ean && prod.descripcion && prod.unidad);

    if (!antesCompleto && ahoraCompleto && !productosEnviados.has(idx)) {
      return { isProductLine: true, completedIndex: idx };
    }

    return { isProductLine: true, completedIndex: null };
  }

  formatProduct(idx: number): string | null {
    const prod = this.state.productos[idx];
    if (!prod) return null;
    return `${idx}️⃣ EAN: ${prod.ean}
Descripción: ${prod.descripcion}
Unidad: ${prod.unidad}
`;
  }

  markSent(idx: number) {
    this.state.productosEnviados.add(idx);
  }
}