import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
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

  @Post('custom')
  async createCustomCategory(
    @Body() body: { name: string; type: string },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.categoriesService.createCustomCategory(
      body.name,
      body.type,
      userId,
    );
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const category = await this.categoriesService.getCategoryById(id);

    console.log('Delete category request:', {
      categoryId: id,
      userId,
      category: category
        ? {
            id: category.id,
            name: category.name,
            is_custom: category.is_custom,
            is_custom_type: typeof category.is_custom,
            created_by: category.created_by,
            created_by_type: typeof category.created_by,
          }
        : null,
    });

    if (!category) {
      throw new ForbiddenException('Category not found');
    }

    // Check if it's a custom category - handle both boolean and numeric (SQLite returns 0/1)
    const isCustom =
      category.is_custom === true ||
      (category.is_custom as unknown as number) === 1 ||
      (category.is_custom as unknown as string) === '1';

    if (!isCustom) {
      console.log('Rejected: Not a custom category', {
        is_custom: category.is_custom,
        is_custom_type: typeof category.is_custom,
      });
      throw new ForbiddenException(
        'You can only delete custom categories, not default ones',
      );
    }

    // Compare as strings to avoid type mismatches
    // If created_by is null but it's custom, allow deletion (orphaned custom category)
    if (
      category.created_by !== null &&
      category.created_by !== undefined &&
      String(category.created_by) !== String(userId)
    ) {
      console.log('Creator mismatch:', {
        created_by: category.created_by,
        created_by_type: typeof category.created_by,
        userId,
        userId_type: typeof userId,
      });
      throw new ForbiddenException(
        'You can only delete custom categories you created',
      );
    }

    return this.categoriesService.deleteCategory(id);
  }

  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Get('type/:type')
  async getCategoriesByType(@Param('type') type: string, @Req() req: any) {
    const userId = req.user?.id;
    if (userId) {
      return this.categoriesService.getCategoriesByTypeForUser(type, userId);
    }
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
