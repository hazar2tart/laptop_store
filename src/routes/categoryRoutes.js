const express = require('express');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    Get all categories (public)
 */
/**
 * @route   GET /api/categories
 * @desc    Get all categories (public)
 * @query   ?parent=<id> | parent=null
 */
router.get('/', async (req, res) => {
  try {
    const { parent } = req.query;

    const filter = {};
    if (parent === 'null') {
      // رجّع بس الكاتيجوري الرئيسية (اللي ما إلها parent)
      filter.parent = null;
    } else if (parent) {
      // رجّع بس الأبناء تبع كاتيجوري معيّنة
      filter.parent = parent;
    }

    const categories = await Category.find(filter).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by id (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);

    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(cat);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category (admin only)
 */
/**
 * @route   POST /api/categories
 * @desc    Create new category (admin only)
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, icon, parentId } = req.body;

    if (!name || !slug) {
      return res
        .status(400)
        .json({ message: 'Name and slug are required' });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    let parent = null;
    if (parentId) {
      parent = await Category.findById(parentId);
      if (!parent) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const cat = await Category.create({
      name,
      slug,
      icon,
      parent: parent ? parent._id : null,
    });

    res.status(201).json(cat);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (admin only)
 */
/**
 * @route   PUT /api/categories/:id
 * @desc    Update category (admin only)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, icon, parentId } = req.body;

    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // لو parentId موجود
    if (typeof parentId !== 'undefined') {
      if (parentId === null || parentId === '' ) {
        cat.parent = null;
      } else {
        const parent = await Category.findById(parentId);
        if (!parent) {
          return res.status(400).json({ message: 'Parent category not found' });
        }
        // اختياري: منع أن يكون الـ parent هو نفسه
        if (parent._id.equals(cat._id)) {
          return res.status(400).json({ message: 'Category cannot be its own parent' });
        }
        cat.parent = parent._id;
      }
    }

    cat.name = name ?? cat.name;
    cat.slug = slug ?? cat.slug;
    cat.icon = icon ?? cat.icon;

    const updated = await cat.save();
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category (admin only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);

    if (!cat) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // (اختياري) تقدري كمان تمسحي/تعدّلي المنتجات اللي كانت في هالكاتيجوري

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get all products for a category (public)
 */
/**
 * @route   GET /api/categories/:id/products
 * @desc    Get all products for a category (public)
 *          يشمل المنتجات في هذه الكاتيجوري + أبنائها
 */
router.get('/:id/products', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // جيب الأبناء المباشرين (تقدر توسّعيها لـ nested لو حبيتي)
    const children = await Category.find({ parent: categoryId }).select('_id');
    const categoryIds = [categoryId, ...children.map(c => c._id.toString())];

    const products = await Product.find({
      categoryIds: { $in: categoryIds },
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('Get category products error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
