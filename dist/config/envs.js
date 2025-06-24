"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = void 0;
require("dotenv/config");
const env_var_1 = require("env-var");
exports.envs = {
    PORT: (0, env_var_1.get)('PORT').required().asPortNumber(),
    TWILIO_ACCOUNT_SID: (0, env_var_1.get)('TWILIO_ACCOUNT_SID').required().asString(),
    TWILIO_AUTH_TOKEN: (0, env_var_1.get)('TWILIO_AUTH_TOKEN').required().asString(),
    OPEN_API_KEY: (0, env_var_1.get)('OPEN_API_KEY').required().asString(),
    EMAIL_ACCOUNT: (0, env_var_1.get)('EMAIL_ACCOUNT').required().asString(),
    EMAIL_PASSWORD: (0, env_var_1.get)('EMAIL_PASSWORD').required().asString(),
    MAIL_SERVICE: (0, env_var_1.get)('MAIL_SERVICE').asString(),
    EMAIL_HOST: (0, env_var_1.get)('EMAIL_HOST').asString(),
    JWT_SEED: (0, env_var_1.get)('JWT_SEED').asString(),
    AWS_ACCESS_KEY_ID: (0, env_var_1.get)('AWS_ACCESS_KEY_ID').required().asString(),
    AWS_SECRET_ACCESS_KEY: (0, env_var_1.get)('AWS_SECRET_ACCESS_KEY').required().asString(),
    AWS_BUCKET_NAME: (0, env_var_1.get)('AWS_BUCKET_NAME').required().asString(),
    AWS_REGION: (0, env_var_1.get)('AWS_REGION').required().asString(),
};
