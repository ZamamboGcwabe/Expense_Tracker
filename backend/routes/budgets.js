const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');

// @route   GET /api/budgets
// @desc    Get budgets for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = { user: req.user._id };
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    
    const budgets = await Budget.find(query).sort({ year: -1, month: -1 });
    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budgets
// @desc    Create or update a budget
// @access  Private
router.post(
  '/',
  [
    auth,
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year').isInt({ min: 2000 }).withMessage('Invalid year'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
    body('category').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { month, year, amount, category = 'Total' } = req.body;

      // Check if budget already exists
      let budget = await Budget.findOne({
        user: req.user._id,
        month,
        year,
        category
      });

      if (budget) {
        // Update existing budget
        budget.amount = amount;
        await budget.save();
      } else {
        // Create new budget
        budget = new Budget({
          user: req.user._id,
          month,
          year,
          amount,
          category
        });
        await budget.save();
      }

      res.json(budget);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Make sure user owns the budget
    if (budget.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
