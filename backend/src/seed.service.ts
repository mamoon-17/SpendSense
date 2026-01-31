import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './modules/categories/categories.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async onModuleInit() {
    await this.seedCategories();
  }

  private async seedCategories() {
    const count = await this.categoriesRepo.count();

    // Only seed if there are no categories
    if (count > 0) {
      console.log('Categories already exist, skipping seed...');
      return;
    }

    console.log('Seeding categories...');

    // 5 default categories shared for both budgets and expenses
    const categories = [
      // Shared categories for budget and expenses (5 default - not deletable)
      { name: 'Food & Dining', type: 'budget', is_custom: false },
      { name: 'Transportation', type: 'budget', is_custom: false },
      { name: 'Entertainment', type: 'budget', is_custom: false },
      { name: 'Shopping', type: 'budget', is_custom: false },
      { name: 'Bills & Utilities', type: 'budget', is_custom: false },

      // Savings categories (3 default)
      { name: 'Emergency Fund', type: 'savings', is_custom: false },
      { name: 'Vacation', type: 'savings', is_custom: false },
      { name: 'Investment', type: 'savings', is_custom: false },

      // Bills categories (3 default)
      { name: 'Rent', type: 'bills', is_custom: false },
      { name: 'Utilities', type: 'bills', is_custom: false },
      { name: 'Internet', type: 'bills', is_custom: false },
    ];

    try {
      for (const categoryData of categories) {
        const category = this.categoriesRepo.create(categoryData);
        await this.categoriesRepo.save(category);
      }
      console.log('Categories seeded successfully!');
    } catch (error) {
      console.error('Error seeding categories:', error);
    }
  }
}
