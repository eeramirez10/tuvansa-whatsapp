"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const get_customers_use_case_1 = require("../../application/use-cases/customers/get-customers.use-case");
const get_customer_use_case_1 = require("../../application/use-cases/customers/get-customer.use-case");
const get_customer_dto_1 = require("../../domain/dtos/quotes/get-customer.dto");
class CustomerController {
    constructor(customerRepository) {
        this.customerRepository = customerRepository;
        this.getCustomers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            new get_customers_use_case_1.GetCustomersUseCase(this.customerRepository)
                .execute()
                .then((customers) => {
                res.json(customers);
            })
                .catch((e) => {
                console.log(e);
                res
                    .status(500)
                    .json({
                    error: 'Hubo un error'
                });
            });
        });
        this.getCustomer = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const [error] = get_customer_dto_1.GetCustomerDto.execute({ id });
            if (error) {
                res
                    .status(400)
                    .json({ error });
                return;
            }
            new get_customer_use_case_1.GetCustomerUseCase(this.customerRepository)
                .execute(id)
                .then((customer) => {
                res.json(customer);
            })
                .catch((e) => {
                console.log(e);
                res
                    .status(500)
                    .json({
                    error: 'Hubo un error'
                });
            });
        });
    }
}
exports.CustomerController = CustomerController;
