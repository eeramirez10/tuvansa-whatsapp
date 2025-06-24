"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesController = void 0;
const get_quotes_use_case_1 = require("../../application/use-cases/quotes/get-quotes.use-case");
const get_quote_by_id_use_case_1 = require("../../application/use-cases/quotes/get-quote-by-id.use-case");
const get_todo_dto_1 = require("../../domain/dtos/quotes/get-todo.dto");
const update_quote_item_dto_1 = require("../../domain/dtos/quotes/update-quote-item.dto");
const update_quote_item_use_case_1 = require("../../application/use-cases/quotes/update-quote-item.use-case");
class QuotesController {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
        this.getQuotes = (req, res, next) => {
            new get_quotes_use_case_1.GetQuotesUseCase(this.quoteRepository)
                .execute()
                .then((quotes) => {
                res.json(quotes);
            })
                .catch((e) => {
                console.log(e);
                res.status(500).json({ error: 'Hubo un error' });
            });
        };
        this.getQuote = (req, res, next) => {
            const id = req.params.id;
            const [error] = get_todo_dto_1.GetTodoDto.execute({ id });
            if (error) {
                res
                    .status(400)
                    .json({ error });
                return;
            }
            new get_quote_by_id_use_case_1.GetQuoteById(this.quoteRepository)
                .execute(id)
                .then((quote) => {
                res
                    .json(quote);
            })
                .catch((e) => {
                console.log(e);
                res
                    .status(500)
                    .json({ error: 'Hubo un error' });
            });
        };
        this.updateQuote = (req, res) => {
            const id = req.params.id;
            const [error, dto] = update_quote_item_dto_1.UpdateQuoteItemDto.execute(req.body);
            if (error) {
                res.status(401).json({ error });
                return;
            }
            new update_quote_item_use_case_1.UpdateQuoteItemUseCase(this.quoteRepository)
                .execute(id, dto)
                .then((data) => {
                res.json(data);
            })
                .catch((e) => {
                console.log(e);
                res
                    .status(500)
                    .json({ error: 'Hubo un error' });
            });
        };
    }
}
exports.QuotesController = QuotesController;
