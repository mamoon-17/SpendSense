import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async createCategory(
    @Body() body: { name: string; type: string; icon?: string },
  ) {
    return this.categoriesService.createCategory(body);
  }

  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Get('type/:type')
  async getCategoriesByType(@Param('type') type: string) {
    return this.categoriesService.getCategoriesByType(type);
  }

  @Get('bills')
  async getBillCategories() {
    return this.categoriesService.getBillCategories();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }
}
