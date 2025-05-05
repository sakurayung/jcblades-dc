import { sendCustomerVerificationWorkflow } from "../workflows/send-email-confirmation";

export default async function userVerificationHandler({
  event: { data },
  container,
}) {
  await sendCustomerVerificationWorkflow(container).run({
    input: { customerId: data.id },
  });
}

export const config = {
  event: "customer.created",
};