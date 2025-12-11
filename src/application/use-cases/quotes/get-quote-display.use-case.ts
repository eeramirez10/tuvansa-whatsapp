import { PrismaClient } from "@prisma/client";
import { DisplayQuery, DisplayResult, ResolutionReason } from "../../../domain/dtos/quotes/display.dto";
import { FileStorageService } from "../../../domain/services/file-storage.service";
import { UserEntity } from "../../../domain/entities/user.entity";
import { QuoteArtifactEntity } from "../../../domain/entities/quote-artifact.entity";


export class GetQuoteDisplayUseCase {

  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: FileStorageService
  ) { }



  async execute(input: DisplayQuery) {
    const { quoteId, prefer, include, presignSeconds } = input;

    const quote = await this.prisma.quote.findUnique({
      where: {
        id: quoteId
      },
      include: {
        customer: true,
        items: true,

      },
    })

    if (!quote) throw new Error('Quote not found');

    const preferFinal = prefer !== 'draft';
    const latestFinal = await this.prisma.quoteVersion.findFirst({
      where: {
        quoteId,
        status: 'FINAL'
      },
      orderBy: {
        versionNumber: 'desc'
      }
    })
    const latestDraft = await this.prisma.quoteVersion.findFirst({
      where: { quoteId, status: 'DRAFT' },
      orderBy: { versionNumber: 'desc' },
    });
    const chosen = preferFinal ? (latestFinal ?? latestDraft) : (latestDraft ?? latestFinal);

    let reason: ResolutionReason = 'NO_VERSION';
    if (chosen) {
      reason = chosen.status === 'FINAL' ? 'FINAL_FOUND' : 'DRAFT_FALLBACK';
    }

    // 3) Si no hay versión, devolvemos el Quote como fuente (AHORA con items + totales)
    if (!chosen) {
      // Mapear items del Quote
      const qItems = quote.items.map(it => {
        const qty = Number(it.quantity ?? 0);
        const price = it.price != null ? Number(it.price) : null;
        const lineTotalNum = price != null ? qty * price : 0;
        return {
          id: it.id,
          description: it.description,
          ean: it.ean ?? null,
          codigo: it.codigo ?? null,
          um: it.um ?? null,
          quantity: qty.toString(),
          price: price != null ? price.toFixed(2) : null,
          lineTotal: lineTotalNum.toFixed(2),
        };
      });

      // Totales básicos (solo suman líneas con price)
      const subtotalNum = qItems.reduce((acc, li) => acc + Number(li.lineTotal), 0);
      // Si no tienes currency/taxRate en Quote, déjalos null o pon defaults
      const taxRate = null;        // o '0.1600' si quieres asumir
      const taxTotalNum = 0;       // sin taxRate fijo, lo dejamos 0
      const grandTotalNum = subtotalNum + taxTotalNum;

      return {
        source: 'QUOTE',
        resolution: { reason: 'NO_VERSION', usedVersionId: null },
        quote: {
          ...quote,
          id: quote.id,
          quoteNumber: quote.quoteNumber ?? null,
          createdAt: quote.createdAt.toISOString(),
          // filekey:quote.fileKey ?? '',
          customer: {
            id: quote.customerId,
            name: quote.customer.name,
            lastname: quote.customer.lastname ?? null,
            phone: quote.customer.phone ?? null,
            email: quote.customer.email ?? null,
            location: quote.customer.location ?? null,
            company: quote.customer.company ?? null
          },
          items: qItems,
          totals: {
            currency: null,               // pon 'MXN' si quieres un default
            taxRate: taxRate,             // '0.1600' si decides asumir IVA
            subtotal: subtotalNum.toFixed(2),
            taxTotal: taxTotalNum.toFixed(2),
            grandTotal: grandTotalNum.toFixed(2),
          },
        },
        version: null,
        quoteMeta: {
          pdfSentAt:null,
          quoteCreatedAt: quote.createdAt ? quote.createdAt.toISOString() : null,
          versionCreatedAt: null,
          sentVia: "",
          sentTo: "",
          createdByUser: null,
          assignedAt: "",
          assignedByUserId: null,
          viewedAt: "",
          acceptedAt: "",
          rejectedAt: "",
          lastUpdatedAt: ""
        },
        capabilities: {
          hasVersion: false,
          hasPdf: false,
          canGeneratePdf: false,    // no hay versión a la cual generar PDF
          canSendWhatsApp: false,
        },
      };
    }

    // 4) Cargar la versión elegida, con includes dinámicos
    const includeVersion: any = {
      seller: true,
    };
    if (include.includes('items')) {
      includeVersion.items = true;
    }
    if (include.includes('artifacts')) {
      includeVersion.artifacts = {
        orderBy: { createdAt: 'desc' },
      };
    }
    if (include.includes('messages')) {
      includeVersion.messages = {
        orderBy: { createdAt: 'desc' },
      };
    }

    const version = await this.prisma.quoteVersion.findUnique({
      where: { id: chosen.id },
      include: {
        seller: true,
        artifacts: true,
        ...includeVersion
      },
    });



    const seller = version.seller as unknown as UserEntity
    const artifacts = version.artifacts as unknown as QuoteArtifactEntity[]


    if (!version) {
      // muy raro: elegido por ID pero no encontrado → retornar como NO_VERSION
      return {
        source: 'QUOTE',
        resolution: { reason: 'NO_VERSION', usedVersionId: null },
        quote: {
          ...quote,
          id: quote.id,
          quoteNumber: quote.quoteNumber ?? null,
          createdAt: quote.createdAt.toISOString(),
          customer: {
            id: quote.customerId,
            name: quote.customer.name,
            lastname: quote.customer.lastname ?? null,
            phone: quote.customer.phone ?? null,
            email: quote.customer.email ?? null,
            location: quote.customer.location ?? null,
          },
        },
        version: null,
        quoteMeta: {
          pdfSentAt: version.pdfSentAt ? version.pdfSentAt.toISOString() : null,
          quoteCreatedAt: quote.createdAt ? quote.createdAt.toISOString() : null,
          versionCreatedAt: version.createdAt ? version.createdAt.toISOString() : null,
          sentVia: "",
          sentTo: "",
          createdByUser: seller ? new UserEntity({ ...seller }) : null,
          assignedAt: "",
          assignedByUserId: null,
          viewedAt: "",
          acceptedAt: "",
          rejectedAt: "",
          lastUpdatedAt: ""
        },
        capabilities: {
          hasVersion: false,
          hasPdf: false,
          canGeneratePdf: false,
          canSendWhatsApp: false,
        },
      };
    }

    // 5) Mapear versión a DTO
    const hasArtifacts = Array.isArray(version.artifacts) && version.artifacts.length > 0;
    const latestPdf = hasArtifacts
      ? artifacts.find(a => a.type === 'PDF') ?? null
      : null;

    // Si piden presign, agregamos presignedUrl al/los artifacts
    let artifactsDto: DisplayResult['version']['artifacts'] | undefined;
    if (include.includes('artifacts') && Array.isArray(version.artifacts)) {
      artifactsDto = await Promise.all(
        version.artifacts.map(async (a) => {
          const base = {
            id: a.id,
            type: a.type as any,
            fileKey: a.fileKey,
            mimeType: a.mimeType ?? null,
            checksum: a.checksum ?? null,
            createdAt: a.createdAt.toISOString(),
          };
          if (presignSeconds && a.fileKey) {
            const url = await this.storage.generatePresignedUrl(a.fileKey, presignSeconds);
            return { ...base, presignedUrl: url, expiresIn: presignSeconds };
          }
          return base;
        })
      );
    }

    const itemsDto = include.includes('items') && Array.isArray(version.items)
      ? version.items.map((it) => ({
        ...it,
        id: it.id,
        description: it.description,
        ean: it.ean ?? null,
        codigo: it.codigo ?? null,
        um: it.um ?? null,
        quantity: it.quantity.toString(),
        price: it.price != null ? it.price.toString() : null,
        lineTotal: (it.lineTotal ?? (it.price ?? 0) * Number(it.quantity)).toString(),
      }))
      : undefined;

    const res = {
      source: 'VERSION',
      resolution: { reason, usedVersionId: version.id },
      quote: {
        ...quote,
        id: quote.id,
        quoteNumber: quote.quoteNumber ?? null,
        createdAt: quote.createdAt.toISOString(),

        customer: {
          id: quote.customerId,
          name: quote.customer.name,
          lastname: quote.customer.lastname ?? null,
          phone: quote.customer.phone ?? null,
          email: quote.customer.email ?? null,
          location: quote.customer.location ?? null,
        },

      },
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        status: version.status,
        currency: version.currency,
        taxRate: version.taxRate.toString(),
        subtotal: version.subtotal.toString(),
        taxTotal: version.taxTotal.toString(),
        grandTotal: version.grandTotal.toString(),
        validUntil: version.validUntil ? version.validUntil.toISOString() : null,
        seller: version.seller ? { id: seller.id, name: seller.name } : null,
        items: itemsDto,
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt ? version.updatedAt.toISOString() : null,
        artifacts: artifactsDto,
      },
      quoteMeta: {
        pdfSentAt: version.pdfSentAt ? version.pdfSentAt.toISOString() : null,
        quoteCreatedAt: quote.createdAt ? quote.createdAt.toISOString() : null,
        versionCreatedAt: version.createdAt ? version.createdAt.toISOString() : null,
        sentVia: "",
        sentTo: "",
        createdByUser: seller ? new UserEntity({ ...seller }) : null,
        assignedAt: "",
        assignedByUserId: null,
        viewedAt: "",
        acceptedAt: "",
        rejectedAt: "",
        lastUpdatedAt: ""
      },

      capabilities: {
        hasVersion: true,
        hasPdf: !!latestPdf,
        canGeneratePdf: !latestPdf,     // si no hay PDF, muestra botón "Generar PDF"
        canSendWhatsApp: !!latestPdf,   // requiere PDF
      },
    };

    return res;



  }


}