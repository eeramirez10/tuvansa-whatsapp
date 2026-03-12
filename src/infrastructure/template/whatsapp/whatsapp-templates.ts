import { envs } from "../../../config/envs";

export enum WhatsappTemplate {
  QUOTE_PDF_FOLLOWUP_FILE = "QUOTE_PDF_FOLLOWUP_FILE",
  COTIZACION_IA_WITH_FILE_DYNAMYC = "COTIZACION_IA_WITH_FILE_DYNAMYC",
  COTIZACION_TUVANSA_IA_02 = "COTIZACION_TUVANSA_IA_02",
  QUOTE_WEB_NOTIFICATION = 'QUOTE_WEB_NOTIFICATION',
  QUOTE_WEB_NOTIFICATION_ICONS = "QUOTE_WEB_NOTIFICATION_ICONS",
  QUOTE_WORKFLOW_MANAGER_NEW = "QUOTE_WORKFLOW_MANAGER_NEW",
  QUOTE_WORKFLOW_MANAGER_VIEWED = "QUOTE_WORKFLOW_MANAGER_VIEWED",
  QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD = "QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD",
  QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP = "QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP",
  QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP = "QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP"
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
  workflow?: {
    quoteNumber?: string | number
    actionView?: string
    actionDownload?: string
    actionAccept?: string
    actionRejectNotQuote?: string
    actionRejectOutOfScope?: string
    actionRejectMenu?: string
    actionRejectClientDeclined?: string
    actionRejectNoResponse?: string
    actionRejectTooExpensive?: string
    actionQuoted?: string
    actionRejected?: string
  };
  presignedUrl?: string;
  mediaUrl?: string;
  url?: string
  downloadUrl?: string
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
      };
    }
  },
  [WhatsappTemplate.QUOTE_WEB_NOTIFICATION_ICONS]: {
    contentSid: "HX466d5b6a2b58b962d7ec2dbe87583c53",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: data.quote.summary,
        2: data.url
      };
    }
  },
  [WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_NEW]: {
    contentSid: envs.TWILIO_TEMPLATE_WORKFLOW_NEW ?? "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: data.quote?.summary ?? '',
        2: `${data.workflow?.quoteNumber ?? ''}`,
        3: data.workflow?.actionView ?? '',
        4: data.url ?? ''
      };
    }
  },
  [WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_VIEWED]: {
    contentSid: envs.TWILIO_TEMPLATE_WORKFLOW_VIEWED ?? "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: `${data.workflow?.quoteNumber ?? ''}`,
        2: data.workflow?.actionDownload ?? ''
      };
    }
  },
  [WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD]: {
    contentSid: envs.TWILIO_TEMPLATE_WORKFLOW_AFTER_DOWNLOAD ?? envs.TWILIO_TEMPLATE_WORKFLOW_REMINDER ?? "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: `${data.workflow?.quoteNumber ?? ''}`,
        2: data.workflow?.actionAccept ?? '',
        3: data.workflow?.actionRejectMenu ?? ''
      };
    }
  },
  [WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP]: {
    contentSid: envs.TWILIO_TEMPLATE_WORKFLOW_REMINDER_PENDING_ERP ?? "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: `${data.workflow?.quoteNumber ?? ''}`,
        2: data.workflow?.actionQuoted ?? '',
        3: data.workflow?.actionRejectMenu ?? ''
      };
    }
  },
  [WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP]: {
    contentSid: envs.TWILIO_TEMPLATE_WORKFLOW_REJECT_REASON_PENDING_ERP ?? "",
    buildVars: function (data: QuoteTemplateData): Record<string, string> {
      return {
        1: `${data.workflow?.quoteNumber ?? ''}`,
        2: data.workflow?.actionRejectNotQuote ?? '',
        3: data.workflow?.actionRejectOutOfScope ?? '',
        4: data.workflow?.actionRejectClientDeclined ?? '',
        5: data.workflow?.actionRejectNoResponse ?? '',
        6: data.workflow?.actionRejectTooExpensive ?? ''
      };
    }
  }
}
