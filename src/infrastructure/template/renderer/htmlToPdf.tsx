import puppeteer from 'puppeteer';

export interface HtmlToPdfOptions {
  timeoutMs?: number;
}

export async function htmlToPdf(
  html: string,
  opts: HtmlToPdfOptions = {}
): Promise<Uint8Array<ArrayBufferLike>> {
  const browser = await puppeteer.launch({
    headless: true, // o true
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || // por si la seteas en Heroku
      'chrome',                               // usa el chrome del buildpack
    args: [
      '--headless',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      // '--remote-debugging-port=9222', // opcional si lo necesitas
    ],
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
      preferCSSPageSize: true,
    });

    await page.close();
    return pdf;
  } finally {
    await browser.close();
  }
}