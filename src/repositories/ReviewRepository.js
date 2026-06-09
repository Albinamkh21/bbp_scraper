const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ReviewRepository {
  async createMany(reviews, tx = prisma) {
    if (!reviews || reviews.length === 0) return { count: 0 };

    return await tx.review.createMany({
      data: reviews.map(review => ({
        productId: review.productId,
        authorName: review.authorName,
        rating: review.rating,
        content: review.content,
        publishedAt: review.publishedAt,
        hasPhotos: review.hasPhotos ?? false
      })),
      skipDuplicates: true
    });
  }

  async findByProductId(productId, tx = prisma) {
    return await tx.review.findMany({
      where: { productId },
      orderBy: { publishedAt: 'desc' }
    });
  }
}

module.exports = new ReviewRepository();