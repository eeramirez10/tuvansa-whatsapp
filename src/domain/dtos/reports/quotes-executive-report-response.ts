export interface QuotesExecutiveTopBranch {
  branchId: string | null;
  branchName: string;
  value: number;
}

export interface QuotesExecutiveKpis {
  totalRequests: number;
  attendedRequests: number;
  attentionRate: number;
  quoted: number;
  rejected: number;
  invoiced: number;
  inProgress: number;
  topBranchByRequests: QuotesExecutiveTopBranch | null;
  topBranchByAttentionRate: QuotesExecutiveTopBranch | null;
  topBranchByBacklog: QuotesExecutiveTopBranch | null;
}

export interface QuotesExecutiveMonthlyRow {
  month: number;
  label: string;
  totalRequests: number;
  attendedRequests: number;
  attentionRate: number;
  inProgress: number;
  quoted: number;
  rejected: number;
  invoiced: number;
}

export interface QuotesExecutiveRejectedTypeRow {
  type: string;
  count: number;
  percentage: number;
}

export interface QuotesExecutiveRejectedTypeMonthlyRow {
  month: number;
  label: string;
  items: QuotesExecutiveRejectedTypeRow[];
}

export interface QuotesExecutiveReportResponse {
  year: number;
  generatedAt: string;
  kpis: QuotesExecutiveKpis;
  monthly: QuotesExecutiveMonthlyRow[];
  rejectedByType: QuotesExecutiveRejectedTypeRow[];
  rejectedByTypeMonthly: QuotesExecutiveRejectedTypeMonthlyRow[];
}
