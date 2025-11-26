export enum WhatsappTemplate {
  QUOTE_PDF_FOLLOWUP_FILE = "QUOTE_PDF_FOLLOWUP_FILE",
  COTIZACION_IA_WITH_FILE_DYNAMYC = "COTIZACION_IA_WITH_FILE_DYNAMYC",
  COTIZACION_TUVANSA_IA_02 = "COTIZACION_TUVANSA_IA_02",
  QUOTE_WEB_NOTIFICATION = 'QUOTE_WEB_NOTIFICATION'
}

export type QuoteTemplateData = {
  to: string;
  version?: {
    customer: { name: string; lastname: string };
    quote: { quoteNumber: string | number };
  };
  quote?: {
    summary: string
  }; // tu tipo de Quote
  presignedUrl?: string;
  mediaUrl?: string;
  url?: string
};

type TemplateConfig = {
  contentSid: string;
  buildVars: (data: QuoteTemplateData) => Record<string, string>;
};


export const WHATSAPP_TEMPLATES: Record<WhatsappTemplate, TemplateConfig> = {
  [WhatsappTemplate.QUOTE_PDF_FOLLOWUP_FILE]: {
    contentSid: 'HXd86bba95952baa6ca444a77a4e34c504',
    buildVars: ({ version, presignedUrl }) => ({
      1: `${version.customer.name} ${version.customer.name}`,
      2: `${version.quote.quoteNumber}`,
      3: `${presignedUrl ?? ''}`
    })
  },
  [WhatsappTemplate.COTIZACION_IA_WITH_FILE_DYNAMYC]: {
    contentSid: "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      throw new Error("Function not implemented.");
    }
  },
  [WhatsappTemplate.COTIZACION_TUVANSA_IA_02]: {
    contentSid: "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      throw new Error("Function not implemented.");
    }
  },
  [WhatsappTemplate.QUOTE_WEB_NOTIFICATION]: {
    contentSid: "HX8e542c86d06b8f5b2016f43ae77964ca",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: data.quote.summary,
        2: data.url
      }
    }
  }
}

