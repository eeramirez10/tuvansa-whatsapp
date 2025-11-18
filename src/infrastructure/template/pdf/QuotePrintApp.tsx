// infrastructure/pdf/template/QuotePrintApp.tsx
import * as React from 'react';
import { QuotePrintProps } from './types';

const nf = (v: string, fraction = 2) =>
  new Intl.NumberFormat('es-MX', { minimumFractionDigits: fraction, maximumFractionDigits: fraction })
    .format(Number(v ?? '0'));

const money = (currency: string, v: string) => `${currency} ${nf(v, 2)}`;

const dateMX = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

export function QuotePrintApp({ header, company, customer, items, totals, terms, branding }: QuotePrintProps) {
  const showBorder = branding.showBorders !== false;

  return (
    <div className="w-screen mx-auto p-6 bg-white font-sans text-sm print:w-full">
      {branding.showWatermarkDraft && header.status === 'DRAFT' && (
        <div className="watermark">BORRADOR</div>
      )}

      {/* Header */}
      <div className={showBorder ? 'border-2 border-black mb-4' : 'mb-4'}>
        <div className="bg-gray-100 p-4 border-b border-black flex justify-between items-start">
          <div className="flex items-center">
            {company.logoUrl && <img src={company.logoUrl} alt="logo" className="h-20" />}
          </div>
          <div className="text-right leading-tight">
            {company.addressLines?.map((l, i) => <p key={i}>{l}</p>)}
            {company.phone && <p>Teléfono: {company.phone}</p>}
            {company.website && <p className="text-blue-600">{company.website}</p>}
          </div>
          <div className="text-right">
            <p>Fecha Cotización: </p>
            <p>{dateMX(header.createdAt)}</p>
            <p className="font-bold text-lg">COTIZACIÓN</p>
            <p className="font-bold">#{String(header.folio)}</p>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className={showBorder ? 'border border-black mb-4 p-3' : 'mb-4 p-3'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="leading-tight">
            <p><strong>{customer.name} {customer.lastname ?? ''}</strong></p>
            <p>{customer.location}</p>
            <p>TELS. {customer.phone}</p>
            <p>E-MAIL: {customer.email}</p>
          </div>
          <div className="text-right leading-tight">
            <p><strong>PLAZO: 0 DÍAS</strong></p>
            {header.validUntil && <p>Vigencia: {dateMX(header.validUntil)}</p>}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className={showBorder ? 'border border-black mb-4 text-sm' : 'mb-4 text-sm'}>
        <table className="w-full table-fixed">
          <thead className="thead-print">
            <tr className="bg-gray-100 border-b border-black">
              <th className="border-r border-black p-2 text-left w-10">#</th>
              <th className="border-r border-black p-2 text-left w-20">CANT</th>
              <th className="border-r border-black p-2 text-left w-20">UM</th>
              <th className="border-r border-black p-2 text-left">DESCRIPCIÓN</th>
              <th className="border-r border-black p-2 text-right w-28">PRECIO UNI</th>
              <th className="p-2 text-right w-32">IMPORTE TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border-r border-gray-300 p-2 text-center">{it.index}</td>
                <td className="border-r border-gray-300 p-2 text-right">{nf(it.quantity, 4)}</td>
                <td className="border-r border-gray-300 p-2 text-center">{it.um ?? ''}</td>
                <td className="border-r border-gray-300 p-2">
                  <div className="leading-tight">
                    <div>{it.description}</div>
                    {(it.ean || it.codigo) && (
                      <div className="text-[11px] text-gray-600 mt-1">
                        {it.ean && <span>EAN: {it.ean} </span>}
                        {it.codigo && <span> · CÓD: {it.codigo}</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="border-r border-gray-300 p-2 text-right">
                  {it.unitPrice ? money(totals.currency, it.unitPrice) : money(totals.currency, '0')}
                </td>
                <td className="p-2 text-right">{money(totals.currency, it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className={showBorder ? 'border border-black' : ''}>
        <div className="bg-gray-100 p-3">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="text-right font-bold">SUB-TOTAL</div>
                <div className="text-right">{money(totals.currency, totals.subtotal)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="text-right font-bold">IVA {Number(totals.taxRate) * 100}%</div>
                <div className="text-right">{money(totals.currency, totals.taxTotal)}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-2">
                <div className="text-right font-bold text-lg">TOTAL</div>
                <div className="text-right font-bold text-lg">{money(totals.currency, totals.grandTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Firma */}
      <div className="mt-6 text-center">
        <p className="mb-4"><strong>ATENTAMENTE</strong></p>
        <div className="border-t border-black w-64 mx-auto mb-2"></div>
        <p><strong>{terms.formCode ?? 'TF-VT-01'}</strong></p>
        <p><strong>{terms.agentName ?? 'Nombre Agente'}</strong></p>
        <p className="mt-4 text-xs"><strong>PRECIOS SUJETOS A CAMBIO SIN PREVIO AVISO</strong></p>
      </div>
    </div>
  );
}
