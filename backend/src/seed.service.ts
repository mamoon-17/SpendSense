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

    const categories = [
      // Budget categories
      { name: 'Food & Dining', type: 'budget', icon: '🍔' },
      { name: 'Travel', type: 'budget', icon: '✈️' },
      { name: 'Entertainment', type: 'budget', icon: '🎬' },
      { name: 'Shopping', type: 'budget', icon: '🛍️' },
      { name: 'Healthcare', type: 'budget', icon: '🏥' },
      { name: 'Education', type: 'budget', icon: '📚' },
      { name: 'Transportation', type: 'budget', icon: '🚗' },
      { name: 'Utilities', type: 'budget', icon: '💡' },
      { name: 'Housing', type: 'budget', icon: '🏠' },
      { name: 'Personal Care', type: 'budget', icon: '💅' },

      // Expense categories
      { name: 'Groceries', type: 'expenses', icon: '🛒' },
      { name: 'Restaurants', type: 'expenses', icon: '🍽️' },
      { name: 'Gas', type: 'expenses', icon: '⛽' },
      { name: 'Bills', type: 'expenses', icon: '📄' },
      { name: 'Subscription', type: 'expenses', icon: '📱' },

      // Savings categories
      { name: 'Emergency Fund', type: 'savings', icon: '🚨' },
      { name: 'Vacation', type: 'savings', icon: '🏖️' },
      { name: 'Investment', type: 'savings', icon: '📈' },
      { name: 'Retirement', type: 'savings', icon: '👴' },

      // Bills categories
      { name: 'Rent', type: 'bills', icon: '🏘️' },
      { name: 'Electricity', type: 'bills', icon: '⚡' },
      { name: 'Water', type: 'bills', icon: '💧' },
      { name: 'Internet', type: 'bills', icon: '🌐' },
      { name: 'Phone', type: 'bills', icon: '📞' },
    ];

    try {
      for (const categoryData of categories) {
        const category = this.categoriesRepo.create(categoryData);
        await this.categoriesRepo.save(category);
      }
      console.log('✅ Categories seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding categories:', error);
    }
  }
}
