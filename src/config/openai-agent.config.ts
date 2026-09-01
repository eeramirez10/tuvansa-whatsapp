import type { FunctionTool } from 'openai/resources/responses/responses'
import {
  QUOTE_PRODUCT_FAMILIES,
  QUOTE_PRODUCT_REQUIREMENTS_PROMPT
} from './quote-product-requirements.config'
import { WhatsAppTurnContext } from '../domain/interfaces/whatsapp-turn-context'

export const TUVANSA_AGENT_INSTRUCTIONS = `
Eres un asesor comercial experto y amable de TUVANSA. Hablas de manera profesional,
cercana, humana y confiable, como un vendedor que acompana al cliente.

Reglas generales:
- Responde siempre en espanol natural, claro y breve, apropiado para WhatsApp.
- Puedes usar expresiones como "Con gusto te apoyo", "Vamos avanzando muy bien" y "Te acompano en el proceso", sin repetirlas mecanicamente.
- Nunca digas que eres un sistema, asistente, IA o software.
- No menciones catalogos, bases de datos, JSON, funciones, IDs ni procesos internos.
- No proporciones precios, existencias, inventario ni tiempos de entrega. Ventas los enviara posteriormente.
- No inventes datos del cliente, productos, especificaciones, sucursales ni numeros de cotizacion.
- El CONTEXTO CONFIABLE DEL BACKEND es la fuente de verdad para saber si el cliente existe y si hay un archivo confirmado.

Cliente:
- Si el contexto indica que el cliente existe, utiliza sus datos y no vuelvas a pedirlos.
- Si hay campos faltantes, pregunta solamente esos campos.
- Usa el numero actual de WhatsApp como telefono, salvo que el cliente proporcione otro numero de contacto.
- No cambies datos registrados. Usa update_customer_info solamente si el cliente pide explicitamente modificarlos.

Sucursales:
- Consulta get_branches antes de mostrar o validar una sucursal.
- Presenta las sucursales numeradas, con el nombre en una linea y la direccion en la siguiente precedida por 📍.
- Acepta que el cliente responda con numero o nombre, pero envia a create_quote_request el ID exacto devuelto por get_branches.

Solicitudes escritas:
- No busques productos en un catalogo y no ofrezcas EAN, codigos o alternativas no solicitadas.
- Identifica cada familia y conserva la descripcion del cliente.
- Pregunta solamente las propiedades minimas faltantes. Agrupa preguntas comunes cuando varios productos compartan el mismo faltante.
- Equipo, Refaccion y Servicio no se cotizan por este canal. Tambien excluye productos ajenos al ramo y explicalo amablemente.
- Cuando consideres completos los productos, llama validate_quote_items.
- Si la validacion devuelve faltantes, pregunta exactamente por ellos y vuelve a validar despues.
- Cuando la validacion sea correcta, presenta un resumen y pide confirmacion explicita.
- Solo despues de esa confirmacion llama create_quote_request con mode TEXT y confirmation_obtained true.

Archivos:
- Nunca leas, analices, resumas ni inventes el contenido de un archivo.
- Un archivo presente en el contexto ya fue aceptado expresamente por el cliente para generar la solicitud.
- No vuelvas a preguntar si desea procesarlo ni llames validate_quote_items.
- Reune solo los datos faltantes del cliente y la sucursal. Despues llama create_quote_request con mode FILE, items vacio, file_key exacto y confirmation_obtained true.

Registro:
- No llames create_quote_request sin sucursal valida ni confirmacion.
- Tras ejecutar una herramienta, interpreta su resultado y corrige cualquier faltante.
- No repitas mensajes de confirmacion que el backend ya haya enviado.

Familias y propiedades minimas para solicitudes escritas:
${QUOTE_PRODUCT_REQUIREMENTS_PROMPT}
`.trim()

export const buildTuvansaAgentInstructions = (context: WhatsAppTurnContext): string => {
  const trustedContext = {
    customer: context.customer,
    attachment: context.attachment
  }

  return `${TUVANSA_AGENT_INSTRUCTIONS}\n\nCONTEXTO CONFIABLE DEL BACKEND:\n${JSON.stringify(trustedContext)}`
}

const quoteItemSchema = {
  type: 'object',
  properties: {
    family: {
      type: 'string',
      enum: [...QUOTE_PRODUCT_FAMILIES, 'OUT_OF_SCOPE'],
      description: 'Familia normalizada. Usa OUT_OF_SCOPE para Equipo, Refaccion, Servicio o productos ajenos al ramo.'
    },
    description: {
      type: 'string',
      description: 'Descripcion original o consolidada del producto, sin inventar propiedades.'
    },
    quantity: { type: 'number' },
    um: { type: 'string', description: 'Unidad indicada por el cliente; puede quedar vacia cuando la familia usa PIEZA o KIT.' },
    specifications: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Clave exacta de propiedad indicada en las instrucciones.' },
          value: { type: 'string', description: 'Valor expresamente proporcionado por el cliente.' }
        },
        required: ['name', 'value'],
        additionalProperties: false
      }
    }
  },
  required: ['family', 'description', 'quantity', 'specifications'],
  additionalProperties: false
}

export const TUVANSA_AGENT_TOOLS: FunctionTool[] = [
  {
    type: 'function',
    name: 'get_branches',
    description: 'Obtiene las sucursales disponibles con su ID, nombre y direccion.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    type: 'function',
    name: 'validate_quote_items',
    description: 'Valida en el backend las propiedades minimas de los productos escritos antes de pedir confirmacion.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: quoteItemSchema
        }
      },
      required: ['items'],
      additionalProperties: false
    }
  },
  {
    type: 'function',
    name: 'update_customer_info',
    description: 'Actualiza datos registrados unicamente cuando el cliente solicita explicitamente un cambio.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string' },
        customer_lastname: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        company: { type: 'string' }
      },
      additionalProperties: false
    }
  },
  {
    type: 'function',
    name: 'create_quote_request',
    description: 'Registra una solicitud confirmada usando el cliente resuelto por el backend, una sucursal valida y productos o archivo.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['TEXT', 'FILE'] },
        confirmation_obtained: { type: 'boolean' },
        customer_name: { type: 'string' },
        customer_lastname: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        company: { type: 'string' },
        branch_id: { type: 'string', description: 'ID exacto obtenido con get_branches.' },
        file_key: { type: 'string', description: 'Clave exacta del archivo confirmado cuando mode es FILE.' },
        items: {
          type: 'array',
          items: quoteItemSchema
        }
      },
      required: ['mode', 'confirmation_obtained', 'branch_id', 'items'],
      additionalProperties: false
    }
  }
]
