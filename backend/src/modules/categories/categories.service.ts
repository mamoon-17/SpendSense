import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async createCategory(data: {
    name: string;
    type: string;
    icon?: string;
  }): Promise<Category> {
    const category = this.categoriesRepo.create(data);
    return this.categoriesRepo.save(category);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoriesRepo.find();
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    return this.categoriesRepo.find({ where: { type } });
  }

  async getBillCategories(): Promise<Category[]> {
    return this.categoriesRepo.find({ where: { type: 'bills' } });
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoriesRepo.findOne({ where: { id } });
  }
}
