const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CategoryRepository {
  normalizeCategoryPath(rawCategories = []) {
    return (rawCategories || [])
      .flatMap((value) => String(value || '').split('>'))
      .map((value) => value.trim())
      .filter(Boolean);
  }

  async ensureCategoryPath(categoryPath, tx = prisma) {
    if (!categoryPath || categoryPath.length === 0) {
      return null;
    }

    let parentId = null;
    let leafCategoryId = null;

    for (const categoryName of categoryPath) {
      let category = await tx.category.findFirst({
        where: {
          name: categoryName,
          parentId
        },
        select: {
          id: true
        }
      });

      if (!category) {
        category = await tx.category.create({
          data: {
            name: categoryName,
            parentId
          }
        });
      }

      leafCategoryId = category.id;
      parentId = category.id;
    }

    return leafCategoryId;
  }

  async syncCategoriesFromProducts(tx = prisma) {
    const products = await tx.product.findMany({
      where: {
        OR: [{ categoryId: null }, { categoryId: '' }]
      },
      select: {
        id: true,
        rawCategories: true
      }
    });

    const syncedCategories = [];

    for (const product of products) {
      const categoryPath = this.normalizeCategoryPath(product.rawCategories);
      const categoryId = await this.ensureCategoryPath(categoryPath, tx);

      if (categoryId) {
        syncedCategories.push({
          productId: product.id,
          categoryId
        });
      }
    }

    return syncedCategories;
  }
}

module.exports = new CategoryRepository();
