// src/infrastructure/pdf/renderer/htmlToPdf.ts
import puppeteer from 'puppeteer';

export interface HtmlToPdfOptions {
  timeoutMs?: number;
}

export async function htmlToPdf(html: string, opts: HtmlToPdfOptions = {}): Promise<Uint8Array<ArrayBufferLike>> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.emulateMediaType('print');

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: opts.timeoutMs ?? 30000,
    });

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // respeta @page del CSS
      // Si quieres forzar aquí: format: 'A4', margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });

    await page.close();
    return pdf;
  } finally {
    await browser.close();
  }
}