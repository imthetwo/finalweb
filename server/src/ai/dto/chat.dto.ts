import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatTurnDto {
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @IsString()
  @MaxLength(4000)
  text!: string;
}

export class ChatDto {
  @IsString()
  @MaxLength(2000, { message: 'Câu hỏi quá dài (tối đa 2000 ký tự)' })
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}
