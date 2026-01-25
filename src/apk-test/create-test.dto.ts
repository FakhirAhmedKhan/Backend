import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTestDto {
    @Transform(({ value }) => String(value))
    @IsString()
    @IsNotEmpty()
    modelId: string;

    @Transform(({ value }) => String(value))
    @IsString()
    @IsNotEmpty()
    versionId: string;
}
