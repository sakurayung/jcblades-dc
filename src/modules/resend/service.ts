import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";
import { Resend, CreateEmailOptions } from "resend";

type ResendOptions = {
  api_key: string;
  from: string;
  html_templates?: Record<
    string,
    {
      subject?: string;
      content: string;
    }
  >;
};

// for logging purposes
type InjectedDependencies = {
  logger: Logger;
};

// where to put email type. if for placing order, email confirmation, etc., STILL IN PROGRESS FOR FINALIZATION
enum Templates {
  ORDER_PLACED = "order-placed",
  EMAIL_CONFIRM = "email-confirm",
}
const templates: { [key in Templates]?: (props: unknown) => React.ReactNode } =
  {
    // TODO: ADD TEMPLATES, REACT-EMAIL
  };

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";
  private resendClient: Resend;
  private options: ResendOptions;
  private logger: Logger;

  // constructor
  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.resendClient = new Resend(options.api_key);
    this.options = options;
    this.logger = logger;
  }

  // opts validation
  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option 'api_key' is required in the provider's options.",
      );
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option 'from' is required in the provider's options.",
      );
    }
  }

  // email templates and types
  getTemplate(template: Templates) {
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates?.[template].content;
    }
    const allowedTemplate = Object.keys(templates);

    if (!allowedTemplate.includes(template)) {
      return null;
    }

    return templates[template];
  }

  getTemplateSubject(template: Templates) {
    if (this.options.html_templates?.[template].subject) {
      return this.options.html_templates?.[template].subject;
    }

    switch (template) {
      case Templates.ORDER_PLACED:
        return "Order Confirmation";
      case Templates.EMAIL_CONFIRM:
        return "Email Confirmation";
      default:
        return "New Email (Placeholder)";
    }
  }

  async send(
    notification: ProviderSendNotificationDTO,
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates);

    if (!template) {
      this.logger.error(
        `Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates)} `,
      );
    }

    const emailOptions: CreateEmailOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
      html: "",
    };

    if (typeof template === "string") {
      emailOptions.html = template;
    } else {
      emailOptions.react = template(notification.data);
      delete emailOptions.html;
    }

    const { data, error } = await this.resendClient.emails.send(emailOptions);

    if (error) {
      this.logger.error("Failed to send email: ", error);
      return {};
    }

    return { id: data.id };
  }
}

export default ResendNotificationProviderService;
