"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepositoryImpl = void 0;
const customer_repository_1 = require("../../domain/repositories/customer.repository");
class CustomerRepositoryImpl extends customer_repository_1.CustomerRepository {
    constructor(customerDatasource) {
        super();
        this.customerDatasource = customerDatasource;
    }
    getCustomers() {
        return this.customerDatasource.getCustomers();
    }
    getCustomerByQuoteNumber(quoteNumber) {
        return this.customerDatasource.getCustomerByQuoteNumber(quoteNumber);
    }
    getById(customerId) {
        return this.customerDatasource.getById(customerId);
    }
    updateCustomer(updateCustometDto) {
        return this.customerDatasource.updateCustomer(updateCustometDto);
    }
    findByPhone(phoneNumber) {
        return this.customerDatasource.findByPhone(phoneNumber);
    }
    createCustomer(createCustomerDto) {
        return this.customerDatasource.createCustomer(createCustomerDto);
    }
}
exports.CustomerRepositoryImpl = CustomerRepositoryImpl;
