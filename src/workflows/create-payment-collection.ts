import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

const createPaymentCollectionStep = createStep(
  "create-payment-collection",
  async ({}, { container }) => {
    const paymentModuleService = container.resolve(Modules.PAYMENT);
    const paymentCollection =
      await paymentModuleService.createPaymentCollections({
        currency_code: "php",
        amount: 1000,
      });

    return new StepResponse({ paymentCollection }, paymentCollection.id);
  },
  async (paymentCollectionId, { container }) => {
    if (!paymentCollectionId) {
      return;
    }
    const paymentModuleService = container.resolve(Modules.PAYMENT);

    await paymentModuleService.deletePaymentCollections([paymentCollectionId]);
  }
);

export const createPaymentCollectionWorkflow = createWorkflow(
  "create-payment-collection",
  () => {
    const { paymentCollection } = createPaymentCollectionStep();

    return new WorkflowResponse({
      paymentCollection,
    });
  }
);
