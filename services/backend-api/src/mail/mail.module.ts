import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";

/**
 * Global so any feature module (auth, notifications, …) can inject
 * MailService without each importing the module.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
