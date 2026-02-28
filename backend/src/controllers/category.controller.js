import Category from '../models/Category.model.js';
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    
    const stats = await Promise.all(
      categories.map(async (category) => {
        const jobCount = await Job.countDocuments({ category: category.name });
        const workerCount = await User.countDocuments({
          userType: 'worker',
          categories: category.name
        });
        
        return {
          name: category.name,
          displayName: category.displayName,
          jobCount,
          workerCount
        };
      })
    );
    
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, displayName, description, keywords } = req.body;
    
    const category = await Category.create({
      name: name.toLowerCase(),
      displayName,
      description,
      keywords: keywords.map(k => k.toLowerCase())
    });
    
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
