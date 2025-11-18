import { createArtifactDto, FinalizeAndVersionInput, QuoteVersionDatasource, QuoteVersionWithItems } from "../../domain/datasource/quote-version.datasource";
import { SaveDraftDto, SaveDraftItemDto } from "../../domain/dtos/versions/save-draft.dto";
import { computeLineTotal, D, sum, toStr } from "../utils/decimals";
import { QuoteVersionItemEntity } from '../../domain/entities/quote-version-item.entity';
import { PrismaClient, VersionStatus } from "@prisma/client";

import { QuoteVersionMapper } from "../mappers/quote-version/quote-version.mapper";
import { QuoteVersionItemMapper } from '../mappers/quote-version/quote-version-item.mapper';


const prismaClient = new PrismaClient()

export class QuoteVersionPostgresqlDatasource implements QuoteVersionDatasource {






  async updateStatus(id: string, status: VersionStatus): Promise<QuoteVersionWithItems | null> {
    const draft = await prismaClient.quoteVersion.update({
      where: {
        id
      },
      data: {
        status
      },
      include: {
        items: true,
        artifacts: true,
        seller: true
      }
    })


    return {
      version: QuoteVersionMapper.entityToQuote(draft as unknown as Record<any, never>),
      items: draft.items.map(i => QuoteVersionMapper.entityToQuoteItem(i as unknown as Record<any, never>))

    }


  }




  async getDraftByQuote(quoteId: unknown): Promise<QuoteVersionWithItems> {
    const draft = await prismaClient.quoteVersion.findFirst({
      where: {
        quoteId
      },
      include: {
        items: true,
        artifacts: true,
        seller: true
      }
    })



    if (!draft) return null

    return {
      version: QuoteVersionMapper.entityToQuote(draft as unknown as Record<any, never>),
      items: draft.items.map(i => QuoteVersionMapper.entityToQuoteItem(i as unknown as Record<any, never>))

    }
  }



  createVersion(input: FinalizeAndVersionInput): Promise<QuoteVersionWithItems> {
    throw new Error("Method not implemented.");
  }


  async saveDraft(input: SaveDraftDto): Promise<QuoteVersionWithItems> {
    const {
      quoteId, sellerId, customerId, currency, taxRate, currencyRate,
      validUntil, paymentTerms, deliveryTime, notes, summary,
      customerSnapshot, items
    } = input


    const prepared = this.preparedItems(items)

    const subtotal = sum(prepared, x => x.lineTotal)
    const headerTaxRate = D(taxRate)
    const taxTotal = subtotal.mul(headerTaxRate)
    const grandTotal = subtotal.add(taxTotal)

    return prismaClient.$transaction(async (tx) => {

      const existingDraft = await tx.quoteVersion.findFirst({
        where: {
          quoteId,
          // status: 'DRAFT' 
        },
        select: { id: true, versionNumber: true },
      })

      let versionId: string



      if (existingDraft) {



        versionId = existingDraft.id;


        await tx.quoteVersionItem.deleteMany({ where: { quoteVersionId: versionId } })

        await tx.quoteVersion.update({
          where: { id: versionId },
          data: {
            customerId: customerId ?? null,
            status: 'DRAFT',
            currency,
            taxRate: headerTaxRate,
            currencyRate: currencyRate != null ? D(currencyRate) : null,

            subtotal,
            discountTotal: null,
            taxTotal,
            grandTotal,

            validUntil: validUntil ?? null,
            paymentTerms: paymentTerms ?? null,
            deliveryTime: deliveryTime ?? null,
            notes: notes ?? null,
            summary: summary ?? null,

            sellerId: sellerId ?? null,
            customerSnapshot: customerSnapshot as any,

            items: { createMany: { data: prepared } },
          }
        })
      } else {

        const agg = await tx.quoteVersion.aggregate({
          where: { quoteId },
          _max: { versionNumber: true },
        })

        const nextNumber = (agg._max.versionNumber ?? 0) + 1

        const created = await tx.quoteVersion.create({
          data: {
            quoteId,
            customerId: customerId ?? null,
            versionNumber: nextNumber,
            status: 'DRAFT',
            currency,
            taxRate: headerTaxRate,
            currencyRate: currencyRate != null ? D(currencyRate) : null,
            subtotal,
            discountTotal: null,
            taxTotal,
            grandTotal,
            validUntil: validUntil ?? null,
            paymentTerms: paymentTerms ?? null,
            deliveryTime: deliveryTime ?? null,
            notes: notes ?? null,
            summary: summary ?? null,
            sellerId: sellerId ?? null,
            customerSnapshot: customerSnapshot as any,
            items: {
              createMany: {
                data: prepared
              }
            },
          },
          include: { items: true },
        })
        versionId = created.id


      }

      await tx.quote.update({
        where: { id: quoteId },
        data: { status: 'QUOTED' }
      })

      const full = await tx.quoteVersion.findUnique({
        where: { id: versionId },
        include: {
          items: true
        }
      })

      const version = QuoteVersionMapper.entityToQuote(full as unknown as Record<any, never>)

      const itemsMapped = full.items.map(i =>
        QuoteVersionItemMapper
          .jsonToEntity(i as unknown as Record<any, never>)
      )


      return {
        version,
        items: itemsMapped
      }

    })


  }


  listByQuote(quoteId: string): Promise<{ id: string; versionNumber: number; createdAt: Date; grandTotal: string; }[]> {
    throw new Error("Method not implemented.");
  }

  async getVersion(versionId: string): Promise<QuoteVersionWithItems | null> {
    const resp = await prismaClient.quoteVersion.findFirst({
      where: {
        id: versionId
      },
      include: {
        items: true,
        quote: true
      }
    })

    return {
      version: QuoteVersionMapper.entityToQuote(resp as unknown as Record<any, never>),
      items: resp.items.map(i => QuoteVersionMapper.entityToQuoteItem(i as unknown as Record<any, never>)),
      quote: resp.quote

    }
  }

  getByQuoteAndNumber(quoteId: string, versionNumber: number): Promise<QuoteVersionWithItems | null> {
    throw new Error("Method not implemented.");
  }

  private preparedItems = (items: SaveDraftItemDto[]) => {
    return items.map(it => {
      const qty = D(it.quantity)
      const price = it.price != null ? D(it.price) : null
      const discAmt = it.discountAmount != null ? D(it.discountAmount) : null
      const lineTotal = computeLineTotal(price, qty, discAmt)
      it.marginPct
      return {
        id: it.id,
        uiLineId: it.uiLineId ?? null,
        description: it.description,
        ean: it.ean ?? null,
        codigo: it.codigo ?? null,
        um: it.um ?? 'UNIT',

        quantity: qty,
        cost: it.cost != null ? D(it.cost) : null,
        currency: it.currency,
        price,
        marginPct: it.marginPct != null ? D(it.marginPct) : null,
        lineTotal,

        discountPct: it.discountPct != null ? D(it.discountPct) : null,
        discountAmount: discAmt,
        taxRate: it.taxRate != null ? D(it.taxRate) : null,

        priceOrigin: it.priceOrigin ?? 'AUTOMATIC',
        sourceProductKey: it.sourceProductKey ?? null,

        warehouse: it.warehouse ?? null,
        binLocation: it.binLocation ?? null,

        quoteItemId: it.quoteItemId ?? null,
      }
    })


  }
}