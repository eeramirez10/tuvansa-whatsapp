import puppeteer from 'puppeteer';

export interface HtmlToPdfOptions {
  timeoutMs?: number;
}

export async function htmlToPdf(
  html: string,
  opts: HtmlToPdfOptions = {}
): Promise<Uint8Array<ArrayBufferLike>> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/app/.chrome-for-testing/chrome-linux64/chrome'; // ruta del buildpack

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--headless',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
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