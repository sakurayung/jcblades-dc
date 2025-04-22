import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  id: string;
};

export const sendEmailConfirmationWorkflow = createWorkflow(
  "send-email-confirmation",

  // TODO:
  // - figure out what module does email confirmation belong
  // -
);
