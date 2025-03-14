import OpenAI from "openai";
import { envs } from "./envs";


export const openai = new OpenAI({ apiKey: envs.OPEN_API_KEY})