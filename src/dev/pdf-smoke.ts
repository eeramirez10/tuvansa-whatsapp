import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { QuotePrintProps } from '../infrastructure/template/pdf/types';
import { renderQuoteHTML } from '../infrastructure/template/renderer/render-quote-html';
import { htmlToPdf } from '../infrastructure/template/renderer/htmlToPdf';

const logoPath = resolve(process.cwd(), 'src/infrastructure/assets/logo-tuvansa.png');
const logoDataUrl = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;
// ⬇️ Ajusta estos paths si tuviste cambios en la estructura:


(async () => {
  // Datos de ejemplo (ajústalos si quieres)
  const props: QuotePrintProps = {
    header: {
      folio: 12345,
      versionNumber: 1,
      status: 'FINAL',
      createdAt: new Date().toISOString(),
      validUntil: null,
    },
    company: {
      name: 'Tubería y Válvulas del Norte S.A. de C.V. (TUVANSA)',
      rfc: 'TVN820506NT0',
      logoUrl: logoDataUrl, // deja vacío para la prueba o usa una URL pública accesible
      addressLines: [
        'Cda. San Buenaventura #12,',
        'Industrial San Buenaventura,',
        '54135 Tlalnepantla, Méx.',
      ],
      phone: '(55) 50 39 07 30',
      website: 'www.tuvansa.com.mx',
    },
    customer: {
      name: 'Erick Enrique',
      lastname: 'Ramírez Torres',
      phone: '55 4114 2762',
      email: 'erick@tuvansa.com.mx',
      location: 'Tlalnepantla, Estado de México',
      rfc: undefined,
    },
    items: [
      {
        index: 1,
        description: 'TUBO DE ACERO AL CARBÓN SIN COSTURA 114.3 x 08.6 mm (4" CED. 80)',
        ean: 'TSC480TM',
        codigo: '01300108',
        um: 'TRAMOS',
        quantity: '2.0000',
        unitPrice: '2500.00',
        lineTotal: '5000.00',
      },
      {
        index: 2,
        description: 'VÁLVULA GLOBO 2" 150# ACERO',
        ean: 'VALG2A150',
        codigo: '04500200',
        um: 'PZA',
        quantity: '1.0000',
        unitPrice: '1800.00',
        lineTotal: '1800.00',
      },
    ],
    totals: {
      currency: 'MXN',
      subtotal: '6800.00',
      taxRate: '0.16',
      taxTotal: '1088.00',
      grandTotal: '7888.00',
    },
    terms: {
      paymentTerms: 'Contado',
      deliveryTime: '3 a 5 días hábiles',
      notes: 'Material sujeto a disponibilidad.',
      agentName: 'Nombre Agente',
      formCode: 'TF-VT-01',
    },
    branding: {
      showWatermarkDraft: false,
      showBorders: true,
    },
  };

  // 1) SSR: React → HTML (inyectando tu print.css)
  const html = renderQuoteHTML (props);

  // 2) Puppeteer: HTML → PDF
  const pdfBuffer = await htmlToPdf(html);

  // 3) Guardar en disco para revisar
  const outPath = resolve(process.cwd(), 'demo-quote1.pdf');
  writeFileSync(outPath, pdfBuffer);
  console.log(`✅ PDF generado: ${outPath}`);
})().catch((err) => {
  console.error('❌ Error generando PDF:', err);
  process.exit(1);
});