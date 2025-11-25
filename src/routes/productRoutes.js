const express = require('express');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products (client + admin) + filter by category
 * @query   ?category=<categoryId>
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.$or = [
        { category },
        { categoryIds: category },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate('category', 'name')
      .populate('categoryIds', 'name')
      .lean(); // 👈 مهم: نخليها plain objects

    // 👇 نبني categoryNames في الـ JSON نفسه
    const withCategoryNames = products.map(p => ({
      ...p,
      categoryNames: Array.isArray(p.categoryIds)
        ? p.categoryIds
            .map(c => c && c.name)
            .filter(Boolean)
        : [],
    }));

    res.json(withCategoryNames);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   POST /api/products/bulk-delete
 * @desc    Delete multiple products (admin only)
 */
/**
 * @route   POST /api/products/bulk-delete
 * @desc    Delete multiple products (admin only)
 */
router.post('/bulk-delete', protect, adminOnly, async (req, res) => {
  try {
    console.log('🟣 BULK DELETE HIT');
    console.log('Body received:', req.body);

    const { ids } = req.body; // array of product ids

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }

    // تأكد أن كل عنصر string
    const cleanIds = ids.filter(Boolean).map(String);
    console.log('Clean ids:', cleanIds);

    const result = await Product.deleteMany({ _id: { $in: cleanIds } });
    console.log('Mongo deleteMany result:', result);

    return res.json({
      message: `Deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount,
      ids: cleanIds,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   GET /api/products/:id
 * @desc    Get single product by id
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('categoryIds', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.categoryNames = Array.isArray(product.categoryIds)
      ? product.categoryIds
          .map(c => c && c.name)
          .filter(Boolean)
      : [];

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create new product (admin only)
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      imageUrl,
      images,
      stock,
      category,        // main (اختياري)
      categories,      // array من الـ Flutter
      colors,
      discountPercent,
    } = req.body;

    if (!name || !brand || !price) {
      return res
        .status(400)
        .json({ message: 'Name, brand and price are required' });
    }

    // 👇 نكوّن قائمة كل الكاتيجوري
    let allCategoryIds = [];
    if (Array.isArray(categories) && categories.length > 0) {
      allCategoryIds = categories;
    } else if (category) {
      allCategoryIds = [category];
    }

    const product = await Product.create({
      name,
      brand,
      price,
      description,
      imageUrl,
      images: Array.isArray(images) ? images : [],
      stock,

      // compat قديم + جديد:
      category: allCategoryIds[0] || null,   // واحدة رئيسية
      categoryIds: allCategoryIds,           // array

      colors: Array.isArray(colors) ? colors : [],
      discountPercent: discountPercent ?? 0,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   PUT /api/products/:id
 * @desc    Update product (admin only)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      brand,
      price,
      description,
      imageUrl,
      images,
      stock,
      category,
      categories,
      colors,
      discountPercent,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name ?? product.name;
    product.brand = brand ?? product.brand;
    product.price = price ?? product.price;
    product.description = description ?? product.description;
    product.imageUrl = imageUrl ?? product.imageUrl;
    product.stock = stock ?? product.stock;

    if (images !== undefined) {
      product.images = Array.isArray(images) ? images : [];
    }

    if (category !== undefined) {
      product.category = category;
    }
    if (categories !== undefined) {
      product.categories = Array.isArray(categories)
        ? categories
        : category
        ? [category]
        : [];
    }

    if (colors !== undefined) {
      product.colors = Array.isArray(colors) ? colors : [];
    }

    if (discountPercent !== undefined) {
      product.discountPercent = discountPercent;
    }

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (admin only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
