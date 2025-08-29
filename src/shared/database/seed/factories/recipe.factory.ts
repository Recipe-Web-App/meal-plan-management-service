/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Recipe } from '@prisma/client';
import { faker } from '@faker-js/faker';

export interface CreateRecipeData {
  id?: string;
  title?: string;
  description?: string;
  cookingTime?: number;
  servings?: number;
  difficulty?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class RecipeFactory {
  private static readonly DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
  private static readonly RECIPE_TYPES = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Dessert',
    'Appetizer',
    'Soup',
    'Salad',
    'Main Course',
    'Side Dish',
  ];

  static create(overrides: CreateRecipeData = {}): CreateRecipeData {
    return {
      id: overrides.id ?? faker.string.uuid(),
      title:
        overrides.title ??
        `${faker.helpers.arrayElement(RecipeFactory.RECIPE_TYPES)} ${faker.food.dish()}`,
      description: overrides.description ?? faker.lorem.paragraph(),
      cookingTime: overrides.cookingTime ?? faker.number.int({ min: 10, max: 180 }),
      servings: overrides.servings ?? faker.number.int({ min: 1, max: 8 }),
      difficulty: overrides.difficulty ?? faker.helpers.arrayElement(RecipeFactory.DIFFICULTIES),
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides: CreateRecipeData = {}): CreateRecipeData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static build(overrides: CreateRecipeData = {}): Omit<Recipe, 'createdAt' | 'updatedAt'> & {
    createdAt?: Date;
    updatedAt?: Date;
  } {
    const data = this.create(overrides);
    const result: any = {
      id: data.id!,
      title: data.title!,
      description: data.description,
      cookingTime: data.cookingTime,
      servings: data.servings,
      difficulty: data.difficulty,
    };

    // Only include dates if explicitly provided in overrides
    if ('createdAt' in overrides && overrides.createdAt) {
      result.createdAt = overrides.createdAt;
    }
    if ('updatedAt' in overrides && overrides.updatedAt) {
      result.updatedAt = overrides.updatedAt;
    }

    return result;
  }

  static createBreakfastRecipe(overrides: CreateRecipeData = {}): CreateRecipeData {
    const breakfastDishes = ['Pancakes', 'Omelette', 'Toast', 'Cereal', 'Smoothie Bowl'];
    return this.create({
      title: `${faker.helpers.arrayElement(breakfastDishes)}`,
      cookingTime: faker.number.int({ min: 5, max: 30 }),
      difficulty: faker.helpers.arrayElement(['Easy', 'Medium']),
      ...overrides,
    });
  }

  static createDinnerRecipe(overrides: CreateRecipeData = {}): CreateRecipeData {
    const dinnerDishes = ['Pasta', 'Steak', 'Chicken Curry', 'Fish Tacos', 'Stir Fry'];
    return this.create({
      title: `${faker.helpers.arrayElement(dinnerDishes)}`,
      cookingTime: faker.number.int({ min: 30, max: 120 }),
      servings: faker.number.int({ min: 2, max: 6 }),
      ...overrides,
    });
  }
}
