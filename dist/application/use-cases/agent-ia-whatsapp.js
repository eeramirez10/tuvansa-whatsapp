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
exports.agentIAWhatsApp = void 0;
const agentIAWhatsApp = (openai, prompt) => __awaiter(void 0, void 0, void 0, function* () {
    const completion = yield openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `
          Tu rol sera de un vendedor de una empresa dedicada a la venta de tuberia de acero al carbon y valvulas, mediante whatsapp,
          saludaras con su nombre, seras cortez, el mensaje del usuario vendra asi:

          {

            ProfileName: nombre del usuario
            Body: lo que escribio el usuario
            WaId: su numero de Whastapp
          }
        
        `,
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        model: 'gpt-4o-mini',
        max_tokens: 150,
    });
    // const has = completion.choices[0] ? JSON.parse(completion.choices[0].message.content) : ''
    return completion.choices[0].message.content;
});
exports.agentIAWhatsApp = agentIAWhatsApp;
