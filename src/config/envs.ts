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
  EMAIL_HOST: get('EMAIL_HOST').asString()
} 