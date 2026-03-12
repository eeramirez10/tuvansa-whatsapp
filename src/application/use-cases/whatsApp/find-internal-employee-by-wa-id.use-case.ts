import { UserRepository } from '../../../domain/repositories/user-repository';

export class FindInternalEmployeeByWaIdUseCase {


  constructor(private readonly repository: UserRepository) { }


  async execute(waId: string) {

    const normalized = this.normalizePhone(waId)
    if (!normalized) return null

    const last10 = normalized.slice(-10)

    return await this.repository.findByWaID(last10)

  }

  private normalizePhone(value?: string | null): string {
    return `${value ?? ''}`.replace(/\D/g, '')
  }
}