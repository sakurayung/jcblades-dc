import {
  Logger,
  ProviderFileResultDTO,
  ProviderUploadFileDTO,
} from "@medusajs/framework/types";
import { loadEnv } from "@medusajs/framework/utils";
import { AbstractFileProviderService } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  apiKey: string;
};

class MyFileProviderService extends AbstractFileProviderService {
  protected logger_: Logger;
  protected options_: Options;
  static identifier = "s3";

  protected client_: any;

  constructor({ logger }: InjectedDependencies) {
    super();
    this.logger_ = logger;
    this.options_ = this.options_;
  }

  async upload(file: ProviderUploadFileDTO): Promise<ProviderFileResultDTO> {
    // Implement your upload logic here
    this.client_.upload(file);
    console.log("uploading file", file);
    return {
      url: process.env.S3_FILE_URL,
      key: "testing.jpg",
    };
  }
}

export default MyFileProviderService;
