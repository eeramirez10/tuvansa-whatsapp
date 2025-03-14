import 'dotenv/config'
import { get } from 'env-var'


export const envs = {
  PORT: get('PORT').required().asPortNumber(),
  TWILIO_ACCOUNT_SID: get('TWILIO_ACCOUNT_SID').required().asString(),
  TWILIO_AUTH_TOKEN: get('TWILIO_AUTH_TOKEN').required().asString(),
  OPEN_API_KEY: get('OPEN_API_KEY').required().asString()
} 