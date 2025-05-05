import { Text, Container, Heading, Html, Button, Section } from "@react-email/components"

type CustomerConfirmationEmailProps = {
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  token: string;
  url: string;
}

function CustomerConfirmationEmailComponent({ customer, token, url }: CustomerConfirmationEmailProps) {
  const confirmationUrl = `${url}/confirm?token=${token}&email=${customer.email}`;
  
  return (
    <Html>
      <Heading>Welcome to our store!</Heading>
      <Container>
        <Section>
          <Text>Hi {customer.first_name},</Text>
          <Text>Thank you for creating an account with us. Please confirm your email address by clicking the button below:</Text>
          <Button href={confirmationUrl}>Confirm Email Address</Button>
          <Text>If you did not create an account, please ignore this email.</Text>
        </Section>
      </Container>
    </Html>
  )
}

export const customerConfirmationEmail = (props: CustomerConfirmationEmailProps) => (
  <CustomerConfirmationEmailComponent {...props} />
)