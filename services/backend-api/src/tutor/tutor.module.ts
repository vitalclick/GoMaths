import { Module } from "@nestjs/common";
import { TutorController } from "./tutor.controller";
import { TutorService } from "./tutor.service";
import { CurriculumModule } from "../curriculum/curriculum.module";

@Module({
  imports: [CurriculumModule],
  providers: [TutorService],
  controllers: [TutorController],
})
export class TutorModule {}
