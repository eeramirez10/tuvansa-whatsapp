import type { FunctionTool } from 'openai/resources/responses/responses'

export const TUVANSA_AGENT_INSTRUCTIONS = `
Eres el asistente de ventas de TUVANSA en WhatsApp. Atiendes solicitudes de
cotizacion de tuberia, valvulas y productos relacionados.

Reglas de conversacion:
- Responde siempre en espanol claro, profesional y breve, apropiado para WhatsApp.
- No uses tablas Markdown ni expongas nombres de funciones, IDs internos o detalles tecnicos.
- No inventes datos del cliente, productos, sucursales ni numeros de cotizacion.
- Consulta get_info_customer cuando necesites saber si el cliente ya esta registrado.
- Consulta get_branches antes de presentar o validar una sucursal. Usa el ID devuelto solo en branch_id.
- Reune nombre, apellidos, correo, telefono, ubicacion, empresa, sucursal y productos antes de registrar una solicitud.
- Cada producto debe incluir descripcion, cantidad y unidad de medida. EAN y codigo pueden quedar vacios si el cliente no los conoce.
- Si el mensaje incluye la clave de un archivo adjunto, procesa el archivo con process_file_for_quote y conserva esa clave en file_key.
- Antes de llamar extract_customer_info, resume los datos y pide confirmacion al cliente. Solo registra cuando confirme.
- Usa update_customer_info unicamente cuando el cliente solicite cambiar datos ya registrados.
- Tras ejecutar una herramienta, interpreta su resultado. No repitas mensajes de confirmacion que el sistema ya envio.
- Si falta informacion, pregunta solo lo necesario para continuar.
`.trim()

export const TUVANSA_AGENT_TOOLS: FunctionTool[] = [
  {
    type: 'function',
    name: 'get_info_customer',
    description: 'Obtiene los datos del cliente asociado al numero de WhatsApp actual.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
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
    name: 'process_file_for_quote',
    description: 'Guarda y prepara el archivo que el cliente adjunto para incluirlo en la solicitud de cotizacion.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        file_key: {
          type: 'string',
          description: 'Clave exacta del archivo indicada en el mensaje del usuario.'
        }
      },
      required: ['file_key'],
      additionalProperties: false
    }
  },
  {
    type: 'function',
    name: 'update_customer_info',
    description: 'Actualiza los datos de un cliente ya registrado. Envia solamente los campos proporcionados por el cliente.',
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
    name: 'extract_customer_info',
    description: 'Registra la solicitud de cotizacion confirmada, junto con el cliente, sucursal, productos y archivo opcional.',
    strict: false,
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: 'Nombre del cliente.' },
        customer_lastname: { type: 'string', description: 'Apellidos del cliente.' },
        email: { type: 'string', description: 'Correo electronico del cliente.' },
        phone: { type: 'string', description: 'Telefono de contacto proporcionado por el cliente.' },
        location: { type: 'string', description: 'Ciudad, estado o ubicacion del cliente.' },
        company: { type: 'string', description: 'Empresa del cliente; usa cadena vacia si no aplica.' },
        branch_id: { type: 'string', description: 'ID exacto de la sucursal elegida, obtenido con get_branches.' },
        file_key: { type: 'string', description: 'Clave del archivo adjunto, si existe.' },
        items: {
          type: 'array',
          description: 'Productos solicitados. Puede quedar vacio cuando el detalle completo viene en un archivo.',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              ean: { type: 'string' },
              codigo: { type: 'string' },
              quantity: { type: 'number' },
              um: { type: 'string' }
            },
            required: ['description', 'quantity', 'um'],
            additionalProperties: false
          }
        }
      },
      required: [
        'customer_name',
        'customer_lastname',
        'email',
        'phone',
        'location',
        'company',
        'branch_id',
        'items'
      ],
      additionalProperties: false
    }
  }
]
