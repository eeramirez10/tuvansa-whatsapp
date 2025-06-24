"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const login_user_dto_1 = require("../../domain/dtos/auth/login-user.dto");
const login_user_use_case_1 = require("../../application/use-cases/auth/login-user.use-case");
const custom_error_1 = require("../../domain/errors/custom-error");
const create_user_dto_1 = require("../../domain/dtos/auth/create-user.dto");
const register_user_use_case_1 = require("../../application/use-cases/auth/register-user.use-case");
const renew_token_use_case_1 = require("../../application/use-cases/auth/renew-token.use-case");
const check_field_dto_1 = require("../../domain/dtos/auth/check-field.dto");
const check_field_use_case_1 = require("../../application/use-cases/auth/check-field.use-case");
class AuthController {
    constructor(authRepository) {
        this.authRepository = authRepository;
        this.handleError = (error, res) => {
            if (error instanceof custom_error_1.CustomError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            console.log(error); // Winston
            return res.status(500).json({ error: 'unknown error' });
        };
        this.loginUser = (req, res, next) => {
            const [error, loginUserDto] = login_user_dto_1.LoginUserDto.execute(req.body);
            if (error) {
                res.status(400).json({ error });
                return;
            }
            new login_user_use_case_1.LoginUserUseCase(this.authRepository)
                .execute(loginUserDto)
                .then((data) => {
                res.json(data);
            })
                .catch((error) => {
                console.log(error);
                this.handleError(error, res);
            });
        };
        this.registerUser = (req, res) => {
            console.log(req.body);
            const [error, createUserDto] = create_user_dto_1.CreateUserDto.execute(req.body);
            if (error) {
                res.status(400).json({ error });
                return;
            }
            new register_user_use_case_1.RegisterUserUseCase(this.authRepository)
                .execute(createUserDto)
                .then((data) => {
                res.json(data);
            })
                .catch((error) => {
                console.log(error['message']);
                this.handleError(error, res);
            });
        };
        this.renewToken = (req, res) => {
            const user = req.body.user;
            new renew_token_use_case_1.RenewTokenUseCase()
                .execute(user)
                .then((data) => {
                res.json(data);
            })
                .catch((error) => {
                console.log(error['message']);
                this.handleError(error, res);
            });
        };
        this.checkField = (req, res) => {
            console.log(req.query);
            const { field, value } = req.query;
            const [error, checkFieldDto] = check_field_dto_1.CheckFieldDto.execute({ field, value });
            if (error) {
                res.status(400).json({ error });
                return;
            }
            new check_field_use_case_1.CheckFieldUseCase(this.authRepository)
                .execute(checkFieldDto)
                .then((exists) => {
                res.json({ exists });
            })
                .catch((error) => {
                console.log(error['message']);
                this.handleError(error, res);
            });
        };
    }
}
exports.AuthController = AuthController;
