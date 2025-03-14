import OpenAI from 'openai';


export const  agentIAWhatsApp = async (openai: OpenAI, prompt: string) => {
  

  const completion = await openai.chat.completions.create({
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
  }) as any


  // const has = completion.choices[0] ? JSON.parse(completion.choices[0].message.content) : ''

  return completion.choices[0].message.content

}