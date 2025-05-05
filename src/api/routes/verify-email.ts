import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async (req: MedusaRequest, res: MedusaResponse) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).json({
      message: "Missing token or email",
    });
  }

  const userService = req.scope.resolve(Modules.USER);

  //@ts-ignore
  const user = await userService.retrieveUser(email);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (
    !user.metadata?.verification_token ||
    user.metadata.verification_token !== token ||
    (user.metadata.token_expires_at &&
      new Date(String(user.metadata.token_expires_at)) < new Date())
  ) {
    return res.status(400).json({
        message: "Invalid or expired token"
    })
  }

   // Mark user as verified
   await userService.updateUsers({
    id: user.id,
    metadata: {
      ...user.metadata,
      email_verified: true,
      verification_token: null,
      token_expires_at: null
    }
   });

  return res.status(200).json({
    message: "Email verified successfully"
  })
};


/**
 * TODO TEST THE API ROUTE
 */
