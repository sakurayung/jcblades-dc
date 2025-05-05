import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/workflows-sdk";
import { transform } from "lodash";
import { generateVerificationToken } from "./steps/generateVerificationToken";
import { ICustomerModuleService, INotificationModuleService } from "@medusajs/framework/types";

type SendVerificationEmailInput = {
  customerId: string;
};

const fetchCustomerStep = createStep(
  "fetch-customer",
  async ({ customerId}, {container}) => {
    const customerModule = container.resolve(Modules.CUSTOMER) as ICustomerModuleService;
    const customer = await customerModule.retrieveCustomer(customerId)
    return new StepResponse({customer});
  }
);


const sendNotificationSteps = createStep(
  "send-notification",
  async ({ customer, token}, {container}) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION) as INotificationModuleService;
    const verificationUrl = `http://localhost:9000/verify-email?token=${token}&email=${customer.email}`
    await notificationModuleService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "email-confirm",
      data: {
        customer: customer,
        verification_url: verificationUrl
      },
    })
    return new StepResponse({});
  }
)
export const sendCustomerVerificationWorkflow = createWorkflow(
  "customer-verification",
  ({customerId}: SendVerificationEmailInput) => {
    //@ts-ignore
    const {customer} = fetchCustomerStep({customerId});
    //@ts-ignore
    const {token} = generateVerificationToken({customerId});
    //@ts-ignore
    sendNotificationSteps({customer, token});
    return new WorkflowResponse({});
  }
)


