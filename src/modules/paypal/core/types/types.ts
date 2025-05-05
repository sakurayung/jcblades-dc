export interface PaypalOptions {
    /**
     * Indicate if it should run as sandbox, default false
     */
    sandbox?: boolean
    clientId: string
    clientSecret: string
    authWebhookId: string
    capture?: boolean
  }
  
  export type PaypalOrder = {
    links: any
    status: keyof typeof PaypalOrderStatus
    invoice_id?: string
  }
  
  export type PurchaseUnits = {
    payments: {
      captures: { id: string }[]
      authorizations: { id: string }[]
    }
    amount: {
      currency_code: string
      value: string
    }
  }[]
  
  export const PaypalOrderStatus = {
    CREATED: "CREATED",
    COMPLETED: "COMPLETED",
    SAVED: "SAVED",
    APPROVED: "APPROVED",
    PAYER_ACTION_REQUIRED: "PAYER_ACTION_REQUIRED",
    VOIDED: "VOIDED",
  }