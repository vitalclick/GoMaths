import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller";
import { CurriculumModule } from "./curriculum/curriculum.module";
import { ProgressModule } from "./progress/progress.module";
import { TutorModule } from "./tutor/tutor.module";
import { SolverModule } from "./solver/solver.module";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/auth.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { ThrottlingModule } from "./throttling/throttling.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ThrottlingModule,
    AuthModule,
    CurriculumModule,
    ProgressModule,
    TutorModule,
    SolverModule,
    NotificationsModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply JWT auth globally. Routes can opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
