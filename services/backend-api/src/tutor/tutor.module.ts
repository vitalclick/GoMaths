import { Module } from "@nestjs/common";
import { TutorController } from "./tutor.controller";
import { TutorService } from "./tutor.service";
import { ConversationsService } from "./conversations.service";
import { CurriculumModule } from "../curriculum/curriculum.module";

@Module({
  imports: [CurriculumModule],
  providers: [TutorService, ConversationsService],
  controllers: [TutorController],
})
export class TutorModule {}
