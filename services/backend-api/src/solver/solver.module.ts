import { Module } from "@nestjs/common";
import { SolverController } from "./solver.controller";
import { SolverService } from "./solver.service";

@Module({
  providers: [SolverService],
  controllers: [SolverController],
})
export class SolverModule {}
