import dotenv from 'dotenv'
import { get } from 'env-var'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })

const isProduction = process.env.NODE_ENV === 'production'
const apiUrl = isProduction
  ? get('API_PROD_URL').required().asString()
  : get('API_DEV_URL').required().asString()

export const envs = {
  NODE_ENV: process.env.NODE_ENV || 'development',
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
  TWILIO_NUMBER: get('TWILIO_NUMBER').required().asString(),
  TWILIO_TEMPLATE_WORKFLOW_NEW: get('TWILIO_TEMPLATE_WORKFLOW_NEW').asString(),
  TWILIO_TEMPLATE_WORKFLOW_VIEWED: get('TWILIO_TEMPLATE_WORKFLOW_VIEWED').asString(),
  TWILIO_TEMPLATE_WORKFLOW_AFTER_DOWNLOAD: get('TWILIO_TEMPLATE_WORKFLOW_AFTER_DOWNLOAD').asString(),
  TWILIO_TEMPLATE_WORKFLOW_REMINDER_PENDING_ERP: get('TWILIO_TEMPLATE_WORKFLOW_REMINDER_PENDING_ERP').asString(),
  TWILIO_TEMPLATE_WORKFLOW_REJECT_REASON_PENDING_ERP: get('TWILIO_TEMPLATE_WORKFLOW_REJECT_REASON_PENDING_ERP').asString(),
  TWILIO_TEMPLATE_WORKFLOW_REMINDER: get('TWILIO_TEMPLATE_WORKFLOW_REMINDER').asString(),
  DEV_PHONE_NUMBER: !isProduction ? get('DEV_PHONE_NUMBER').asString() : undefined,
  QUOTE_EXTRACTION_API_URL: get('QUOTE_EXTRACTION_API_URL').default('http://localhost:4500').asString(),
  API_URL: apiUrl
} 
