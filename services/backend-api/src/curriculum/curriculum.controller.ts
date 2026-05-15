import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurriculumService } from "./curriculum.service";
import { Public } from "../auth/auth.guard";
import type { Difficulty } from "./curriculum.types";

/**
 * Curriculum reads are public — anyone can browse the syllabus, even
 * unauthenticated. The authoring side (write paths) will be auth-gated
 * when it lands in Phase 1.
 */
@ApiTags("curriculum")
@Controller("curriculum")
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Public()
  @Get("grades/:grade")
  @ApiOperation({ summary: "List topics for a grade" })
  listByGrade(@Param("grade", ParseIntPipe) grade: number) {
    return this.service.listByGrade(grade);
  }

  @Public()
  @Get("topics/:topicId")
  @ApiOperation({ summary: "Get a topic with its lesson content" })
  getTopic(@Param("topicId") topicId: string) {
    return this.service.getTopic(topicId);
  }

  @Public()
  @Get("topics/:topicId/questions")
  @ApiOperation({ summary: "List practice questions for a topic" })
  @ApiQuery({ name: "difficulty", required: false, enum: ["easy", "medium", "hard"] })
  listQuestions(
    @Param("topicId") topicId: string,
    @Query("difficulty") difficulty?: Difficulty,
  ) {
    return this.service.listQuestions(topicId, difficulty);
  }
}
