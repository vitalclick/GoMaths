import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { ProgressModule } from "./progress/progress.module";
import { TutorModule } from "./tutor/tutor.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CurriculumModule,
    ProgressModule,
    TutorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
