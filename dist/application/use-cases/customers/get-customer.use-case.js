"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCustomerUseCase = void 0;
class GetCustomerUseCase {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
    }
    execute(id) {
        return this.customerRepository.getById(id);
    }
}
exports.GetCustomerUseCase = GetCustomerUseCase;
