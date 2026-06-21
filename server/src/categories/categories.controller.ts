import { Controller, Get, Header, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('menu')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  menu() {
    return this.categoriesService.getMenu();
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  list() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60')
  one(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }
}
