import 'dotenv/config'
import { get } from 'env-var'


export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  TWILIO_ACCOUNT_SID: get('TWILIO_ACCOUNT_SID').required().asString(),
  TWILIO_AUTH_TOKEN: get('TWILIO_AUTH_TOKEN').required().asString(),
  OPEN_API_KEY: get('OPEN_API_KEY').required().asString(),
  EMAIL_ACCOUNT: get('EMAIL_ACCOUNT').required().asString(),
  EMAIL_PASSWORD: get('EMAIL_PASSWORD').required().asString(),
  MAIL_SERVICE: get('MAIL_SERVICE').asString(),
  EMAIL_HOST: get('EMAIL_HOST').asString(),
  JWT_SEED: get('JWT_SEED').asString(),
  AWS_ACCESS_KEY_ID: get('AWS_ACCESS_KEY_ID').required().asString(),
  AWS_SECRET_ACCESS_KEY: get('AWS_SECRET_ACCESS_KEY').required().asString(),
  AWS_BUCKET_NAME: get('AWS_BUCKET_NAME').required().asString(),
  AWS_REGION: get('AWS_REGION').required().asString(),
  TWILIO_NUMBER:get('TWILIO_NUMBER').required().asString()
} 