// src/infrastructure/pdf/renderer/render-quote-html.ts
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { QuotePrintProps } from '../pdf/types';
import { QuotePrintApp } from '../pdf/QuotePrintApp';



export function renderQuoteHTML(
  props: QuotePrintProps,
  cssPath = resolve(__dirname, '../pdf/print.css')
): string {
  const css = readFileSync(cssPath, 'utf8');
  const appHtml = renderToString(<QuotePrintApp {...props} />);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cotización v${props.header.versionNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${css}</style>
</head>
<body>
  <div id="root">${appHtml}</div>
</body>
</html>`;
}