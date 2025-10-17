import OpenAI from "openai";
import { envs } from "../../config/envs";

export class OpenAiFunctinsService {

  private openai = new OpenAI({ apiKey: envs.OPEN_API_KEY })
  constructor() {
  }

  async summarizeConversation(messages: {
    role: string;
    content: string;
    createdAt: string;
  }[]) {
    // Construimos el prompt con los mensajes
    const conversation = messages.map(m => {
      const who = m.role === "assistant" ? "Asistente (TUVANSA)" : "Cliente";
      return `[${m.createdAt}] ${who}: ${m.content}`;
    }).join("\n");

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que genera resúmenes breves y claros de conversaciones entre un cliente y un asistente de ventas."
        },
        {
          role: "user",
          content: `
          Haz un resumen conciso de la siguiente conversación solo pon lo que
           pidio el cliente para cotizar en resumen y su nombre y como fue la conversacion , omite que contacto a Tueria y valvulas del norte y sus datos personales como telefono , ubicacion, pon el texto son caracteres especiales ni asteriscos pon todo de corrido :\n\n${conversation}
          `
        }
      ],
      temperature: 0.5
    });


    return response.choices[0].message.content;
  }

}