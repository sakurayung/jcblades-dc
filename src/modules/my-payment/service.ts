import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { PaymentProviderError, PaymentProviderSessionResponse, PaymentSessionStatus, CreatePaymentProviderSession, UpdatePaymentProviderSession, ProviderWebhookPayload, WebhookActionResult } from "@medusajs/types";

type Options = {
    apiKey: string;
}


class ManualPaymentProviderService extends AbstractPaymentProvider<Options> {
    capturePayment(paymentData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.");
    }
    authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProviderError | { status: PaymentSessionStatus; data: PaymentProviderSessionResponse["data"]; }> {
        throw new Error("Method not implemented.");
    }
    cancelPayment(paymentData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.");
    }
    initiatePayment(context: CreatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        throw new Error("Method not implemented.");
    }
    deletePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.");
    }
    getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
        throw new Error("Method not implemented.");
    }
    refundPayment(paymentData: Record<string, unknown>, refundAmount: number): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.");
    }
    retrievePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        throw new Error("Method not implemented.");
    }
    updatePayment(context: UpdatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        throw new Error("Method not implemented.");
    }
    getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
        throw new Error("Method not implemented.");
    }
    static identifier = 'manual-payment-provider';


    constructor(container, options) {
        super(container, options)
    }
}


export default ManualPaymentProviderService