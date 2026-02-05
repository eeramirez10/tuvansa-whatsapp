import test from 'node:test';
import assert from 'node:assert/strict';

import { PrismaClient, QuoteStatus } from '@prisma/client';
import { QuotePostgresqlDatasource } from '../src/infrastructure/datasource/quote-postgresql.datasource';

// Ojo con la ruta de import ↑ ajústala según tu estructura real

const prisma = new PrismaClient();
const datasource = new QuotePostgresqlDatasource();

test('addQuoteItems crea items sin tronar el engine', async (t) => {
  // 1. Obtén o crea una quote de prueba
  const quote = await prisma.quote.create({
    data: {
      quoteNumber: 1,
      fileKey: null,
      summary: null,
      chatThreadId: null,
      // ajusta a tu modelo de Quote
      customerId: "ba3cb678-7931-4ef2-8d0a-99010cd27c20",
      status: QuoteStatus.PENDING,
      // ... lo mínimo que pida el modelo
    },
  });

  const items = [
    {
      description: 'Tubo de PVC 2” (test)',
      ean: 'PVC200TM',
      codigo: '',         // mejor null que '' para probar
      quantity: 200,
      um: 'METRO',
      price: null,
      cost: null,
      quoteId: '2e8f8f92-d3e9-4d0c-b743-73155219c93a',              // <- obligatorio según tu modelo
    },
    {
      description: 'Tubo de PVC 2” (test)',
      ean: 'PVC200TM',
      codigo: '',         // mejor null que '' para probar
      quantity: 200,
      um: 'METRO',
      price: null,
      cost: null,
      quoteId: '2e8f8f92-d3e9-4d0c-b743-73155219c93a',              // <- obligatorio según tu modelo
    }
  ];

  // 2. Llamas directamente a tu método del datasource
  const result = await datasource.addQuoteItems({
    price: 0,
    cost: 0,
    quoteId: 'd6ecc7c3-8556-4e28-b86e-6885fc9f6298',
    description: 'Tubo de PVC 2”',
    ean: 'PVC200TM',
    codigo: '',
    quantity: 200,
    um: 'METRO'
  });

  // 3. Aserciones básicas
  assert.ok(result);
  // aquí depende de qué devuelva addQuoteItems
  // por ejemplo, si regresa los items creados:


  // 4. Limpieza opcional
  await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
  await prisma.quote.delete({ where: { id: quote.id } });
});

test.after(async () => {
  await prisma.$disconnect();
});