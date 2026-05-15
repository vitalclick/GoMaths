import { Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { SolverService } from "./solver.service";
import { CurrentUser, type JwtClaims } from "../auth/auth.guard";

class SolveLatexDto {
  @IsString()
  latex!: string;
}

@ApiTags("solver")
@ApiBearerAuth()
@Controller("solver")
export class SolverController {
  constructor(private readonly service: SolverService) {}

  @Post("scan")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 8 * 1024 * 1024 } }))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["image"],
      properties: { image: { type: "string", format: "binary" } },
    },
  })
  @ApiOperation({ summary: "Scan an image of an equation and return a step-wise solution" })
  scan(@CurrentUser() _user: JwtClaims, @UploadedFile() image: Express.Multer.File) {
    return this.service.scan(image);
  }

  @Post("solve")
  @ApiOperation({ summary: "Solve a LaTeX expression directly (skipping OCR)" })
  solve(@CurrentUser() _user: JwtClaims, @Body() dto: SolveLatexDto) {
    return this.service.solveLatex(dto.latex);
  }
}
