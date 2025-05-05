import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).json({
      message: "Missing token or email",
    });
  }

  const customerModuleService = req.scope.resolve(
    Modules.CUSTOMER
  ) as ICustomerModuleService;

  try {
    const customers = await customerModuleService.listCustomers(
      {
        email: email as string,
      },
      {
        select: ["id", "email", "metadata"],
      }
    );
    if (!customers || customers.length === 0) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customer = customers[0];
    console.log(`Customer ID: ${customer.id}, Email: ${customer.email}`);
    console.log("Raw metadata from customer:", customer.metadata);
    console.log(
      "Customer full metadata (JSON):",
      JSON.stringify(customer.metadata)
    );
    // Check if token is valid and not expired
    if (
      !customer.metadata ||
      !customer.metadata?.verification_token ||
      customer.metadata?.verification_token !== token
    ) {
      console.log(
        "Invalid token",
        customer.metadata?.verification_token,
        token
      );
      return res.status(400).json({
        message: "Invalid token",
        token,
      });
    }

    // Check expiration separately
    if (
      customer.metadata.token_expires_at &&
      new Date(String(customer.metadata.token_expires_at)) < new Date()
    ) {
      return res.status(400).json({
        message: "Token has expired",
      });
    }

    // Update customer metadata to mark email as verified
    await customerModuleService.updateCustomers(
      { id: customer.id },
      {
        metadata: {
          email_verified: true,
          verification_token: null,
          token_expires_at: null,
        },
      }
    );
    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred during verification",
      error: error.message,
    });
  }
};
