import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { removeCustomerAccountWorkflow, deleteCustomersWorkflow } from "@medusajs/medusa/core-flows";

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context.actor_id;

  // Remove customer account and auth identity association
  await removeCustomerAccountWorkflow(req.scope).run({
    input: { customerId }
  });

  // Soft delete the customer (sets deleted_at)
  await deleteCustomersWorkflow(req.scope).run({
    input: { ids: [customerId] }
  });

  res.status(204).send({});
};