import { CustomerDTO } from "@medusajs/framework/types";
import { Text, Container, Heading, Html, Button, Section, Tailwind } from "@react-email/components"
import { first } from "lodash";

type CustomerConfirmationEmailProps = {
  customer: CustomerDTO
}


function CustomerConfirmationEmailComponent({ customer }: CustomerConfirmationEmailProps) {
  const backendUrl = process.env.BACKEND_URL

  const confirmationUrl = `${backendUrl}/verify-email?token=${customer.metadata?.verification_token}&email=${customer.email}`
  
  return (
    <Tailwind>
    <Html className="font-sans bg-gray-100">
      <Heading className="flex justify-center text-center text-3xl">Welcome to JC Blades!</Heading>
      <Container>
        <Section>
          <Text>Hi {customer.first_name},</Text>
          <Text>Thank you for creating an account with us. Please confirm your email address by clicking the button below:</Text>
          <Button href={String(confirmationUrl || '#')}>Confirm Email Address</Button>
          <Text>If you did not create an account, please ignore this email.</Text>
        </Section>
      </Container>
    </Html>
    </Tailwind>
  )
}

const mockData = {
  customer: {
    first_name: "John",
    email: "testing12345@gmail.com",
    verification_url: "https://"
  }
}

//@ts-ignore
export default () => <CustomerConfirmationEmailComponent {...mockData} />

export const customerConfirmationEmail = (props: CustomerConfirmationEmailProps) => (
  <CustomerConfirmationEmailComponent {...props} />
)