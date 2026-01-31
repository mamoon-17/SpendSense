import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Category } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async createCategory(data: {
    name: string;
    type: string;
    icon?: string;
  }): Promise<Category> {
    const category = this.categoriesRepo.create(data);
    return this.categoriesRepo.save(category);
  }

  async createCustomCategory(
    name: string,
    type: string,
    userId: string,
  ): Promise<Category> {
    // Check if a category with the same name and type already exists for this user or as default
    const existing = await this.categoriesRepo.findOne({
      where: [
        { name, type, is_custom: false }, // Default category
        { name, type, created_by: userId }, // User's custom category
      ],
    });

    if (existing) {
      return existing; // Return existing category instead of creating duplicate
    }

    const category = this.categoriesRepo.create({
      name,
      type,
      is_custom: true,
      created_by: userId,
    });

    return this.categoriesRepo.save(category);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoriesRepo.find();
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    return this.categoriesRepo.find({ where: { type } });
  }

  async getCategoriesByTypeForUser(
    type: string,
    userId: string,
  ): Promise<Category[]> {
    // Get default categories + user's custom categories
    return this.categoriesRepo
      .createQueryBuilder('category')
      .where('category.type = :type', { type })
      .andWhere(
        '(category.is_custom = false OR category.created_by = :userId)',
        { userId },
      )
      .orderBy('category.is_custom', 'ASC') // Default categories first
      .addOrderBy('category.name', 'ASC')
      .getMany();
  }

  async getBillCategories(): Promise<Category[]> {
    return this.categoriesRepo.find({ where: { type: 'bills' } });
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoriesRepo.findOne({ where: { id } });
  }

  async findOrCreateCategory(
    name: string,
    type: string,
    userId: string,
  ): Promise<Category> {
    // First check if it's a default category
    let category = await this.categoriesRepo.findOne({
      where: { name, type, is_custom: false },
    });

    if (category) {
      return category;
    }

    // Check for user's custom category
    category = await this.categoriesRepo.findOne({
      where: { name, type, created_by: userId },
    });

    if (category) {
      return category;
    }

    // Create new custom category
    return this.createCustomCategory(name, type, userId);
  }

  async deleteCategory(id: string): Promise<{ deleted: boolean }> {
    // First unlink all expenses that use this category
    await this.dataSource
      .createQueryBuilder()
      .update('expenses')
      .set({ category_id: null })
      .where('category_id = :id', { id })
      .execute();

    // Unlink all budgets that use this category
    await this.dataSource
      .createQueryBuilder()
      .update('budgets')
      .set({ category: null })
      .where('category = :id', { id })
      .execute();

    // Now delete the category
    const result = await this.categoriesRepo.delete(id);
    return { deleted: (result.affected ?? 0) > 0 };
  }
}
