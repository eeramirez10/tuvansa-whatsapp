import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

import { QuotesController } from '../../../src/presentation/quotes/controller';
import type { QuoteRepository } from '../../../src/domain/repositories/quote.repository';
import { QuoteVersionRepository } from '../../../src/domain/repositories/quote-version.repository';
import type { OpenAiFunctinsService } from '../../../src/infrastructure/services/openai-functions.service';
import type { PrismaClient, VersionStatus } from '@prisma/client';
import type { FileStorageService } from '../../../src/domain/services/file-storage.service';
import type { QuoteVersionWithItems } from '../../../src/domain/datasource/quote-version.datasource';
import type { SaveDraftDto } from '../../../src/domain/dtos/versions/save-draft.dto';
import type { QuoteVersionEntity } from '../../../src/domain/entities/quote-version.entity';
import type { QuoteVersionItemEntity } from '../../../src/domain/entities/quote-version-item.entity';

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

type MockResponse = Response & {
  statusCode?: number;
  jsonPayload?: unknown;
};

type QuoteVersionRepoOptions = {
  response?: QuoteVersionWithItems;
  reject?: boolean;
};

class QuoteVersionRepoStub extends QuoteVersionRepository {
  public lastInput: SaveDraftDto | null = null;

  constructor(private readonly options: QuoteVersionRepoOptions = {}) {
    super();
  }

  async createVersion(): Promise<QuoteVersionWithItems> {
    throw new Error('not implemented');
  }

  async saveDraft(input: SaveDraftDto): Promise<QuoteVersionWithItems> {
    this.lastInput = input;

    if (this.options.reject) {
      throw new Error('saveDraft failure');
    }

    return (
      this.options.response ?? ({
        version: {} as QuoteVersionEntity,
        items: [] as QuoteVersionItemEntity[],
      } satisfies QuoteVersionWithItems)
    );
  }

  async getDraftByQuote(): Promise<QuoteVersionWithItems | null> {
    return null;
  }

  async listByQuote(): Promise<
    { id: string; versionNumber: number; createdAt: Date; grandTotal: string }[]
  > {
    return [];
  }

  async getVersion(): Promise<QuoteVersionWithItems | null> {
    return null;
  }

  async getByQuoteAndNumber(): Promise<QuoteVersionWithItems | null> {
    return null;
  }

  async updateStatus(_id: string, _status: VersionStatus): Promise<QuoteVersionWithItems | null> {
    return null;
  }
}

const createMockResponse = (): MockResponse => {
  const res: Partial<Response> & { statusCode?: number; jsonPayload?: unknown } = {
    statusCode: 200,
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res as Response;
  };

  res.json = (payload: unknown) => {
    res.jsonPayload = payload;
    return res as Response;
  };

  return res as MockResponse;
};

const createController = (options: QuoteVersionRepoOptions = {}) => {
  const repo = new QuoteVersionRepoStub(options);
  const controller = new QuotesController(
    {} as QuoteRepository,
    repo,
    {} as OpenAiFunctinsService,
    {} as PrismaClient,
    {} as FileStorageService
  );

  return { controller, repo };
};

const buildValidRequest = () => {
  const storeQuote = {
    id: 'quote-1',
    currency: 'MXN',
    taxRate: 0.16,
    summary: 'Resumen',
    customer: {
      name: 'Ada',
      lastname: 'Lovelace',
      phone: '555-1234',
      email: 'ada@example.com',
      location: 'CDMX',
    },
    items: [
      {
        id: 'line-1',
        description: 'Servidor',
        ean: '123456789',
        um: 'PCS',
        qty: 2,
        cost: 950,
        currency: 'MXN',
        price: 1250,
        margin: 25,
        source: {
          productKey: 'SKU-1',
          warehouse: 'WH-1',
        },
      },
    ],
  };

  return {
    params: { quoteId: 'quote-1' },
    body: {
      user: { id: 'seller-1' },
      customerId: 'customer-1',
      storeQuote,
      notes: 'Entrega inmediata',
    },
  };
};

describe('QuotesController.saveDraft', () => {
  it('returns 400 when dto validation fails', async () => {
    const { controller } = createController();
    const invalidRequest = {
      params: { quoteId: 'quote-1' },
      body: {
        user: { id: 'seller-1' },
        storeQuote: {
          id: 'quote-1',
          currency: 'MXN',
          taxRate: 0.16,
          items: [],
        },
      },
    };
    const res = createMockResponse();

    controller.saveDraft(invalidRequest as unknown as Request, res);
    await flushPromises();

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, { error: 'La cotización debe contener al menos un renglón' });
  });

  it('persists the generated DTO and returns the repository payload on success', async () => {
    const repoResponse: QuoteVersionWithItems = {
      version: {} as QuoteVersionEntity,
      items: [] as QuoteVersionItemEntity[],
    };
    const { controller, repo } = createController({ response: repoResponse });
    const req = buildValidRequest();
    const res = createMockResponse();

    controller.saveDraft(req as unknown as Request, res);
    await flushPromises();

    assert.equal(repo.lastInput?.quoteId, 'quote-1');
    assert.equal(repo.lastInput?.sellerId, 'seller-1');
    assert.equal(repo.lastInput?.items.length, 1);
    assert.equal(repo.lastInput?.items[0]?.quantity, '2.0000');
    assert.equal(repo.lastInput?.items[0]?.priceOrigin, 'MANUAL');
    assert.equal(repo.lastInput?.customerSnapshot.name, 'Ada');
    assert.deepEqual(res.jsonPayload, repoResponse);
    assert.equal(res.statusCode, 200);
  });

  it('responds with 500 when the repository throws', async () => {
    const { controller } = createController({ reject: true });
    const req = buildValidRequest();
    const res = createMockResponse();

    controller.saveDraft(req as unknown as Request, res);
    await flushPromises();

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.jsonPayload, { error: 'Hubo un error [saveDraft]' });
  });
});
