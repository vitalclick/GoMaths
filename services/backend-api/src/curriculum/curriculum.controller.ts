import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CurriculumService } from "./curriculum.service";
import type { Difficulty } from "./curriculum.types";

@ApiTags("curriculum")
@Controller("curriculum")
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get("grades/:grade")
  @ApiOperation({ summary: "List topics for a grade" })
  listByGrade(@Param("grade", ParseIntPipe) grade: number) {
    return this.service.listByGrade(grade);
  }

  @Get("topics/:topicId")
  @ApiOperation({ summary: "Get a topic with its lesson content" })
  getTopic(@Param("topicId") topicId: string) {
    return this.service.getTopic(topicId);
  }

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
