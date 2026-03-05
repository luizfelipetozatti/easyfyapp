// ============================================================
// Easyfy - Tipos da API Asaas
// Tipagem completa para os recursos utilizados na integração
// ============================================================

export type AsaasBillingType = "CREDIT_CARD" | "BOLETO" | "PIX" | "UNDEFINED";
export type AsaasCycle = "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
export type AsaasSubscriptionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "DELETED"
  | "RESTORED"
  | "AWAITING_CHARGEBACK"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS"
  | "AWAITING_CHARGEBACK_REVERSAL";

// ============================================================
// CUSTOMER
// ============================================================

export interface AsaasCustomerCreate {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  externalReference?: string;
  dateCreated: string;
  deleted: boolean;
}

// ============================================================
// SUBSCRIPTION
// ============================================================

export interface AsaasSubscriptionCreate {
  customer: string;
  billingType: AsaasBillingType;
  cycle: AsaasCycle;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  endDate?: string;
  maxPayments?: number;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: "FIXED" | "PERCENTAGE";
  };
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  cycle: AsaasCycle;
  value: number;
  nextDueDate: string;
  status: AsaasSubscriptionStatus;
  description?: string;
  externalReference?: string;
  endDate?: string;
  dateCreated: string;
  deleted: boolean;
}

// ============================================================
// PAYMENT
// ============================================================

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  value: number;
  netValue: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  description?: string;
  externalReference?: string;
  dateCreated: string;
  clientPaymentDate?: string;
  paymentDate?: string;
}

// ============================================================
// PAGINATED LIST
// ============================================================

export interface AsaasListResponse<T> {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

// ============================================================
// WEBHOOK EVENTS
// ============================================================

export type AsaasWebhookEventType =
  // Payments
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "PAYMENT_DUNNING_RECEIVED"
  | "PAYMENT_DUNNING_REQUESTED"
  | "PAYMENT_BANK_SLIP_VIEWED"
  | "PAYMENT_CHECKOUT_VIEWED"
  // Subscriptions
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_DELETED"
  | "SUBSCRIPTION_CANCELLED";

export interface AsaasWebhookEvent {
  event: AsaasWebhookEventType;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}

// ============================================================
// ERROR
// ============================================================

export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}
