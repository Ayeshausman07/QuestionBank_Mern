const express = require('express');
const router = express.Router();
const {
  getQuestions,
  getMyQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestion,
  getAllQuestions,
  forceDeleteQuestion
} = require('../controllers/questionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/public', getQuestions);

// User protected routes
router.get('/my-questions', protect, getMyQuestions);
router.post('/', protect, createQuestion);
router.put('/:id', protect, updateQuestion);
router.delete('/:id', protect, deleteQuestion);
router.delete('/:id', protect, deleteQuestion);

// Admin routes
router.delete('/admin/:id', protect, adminOnly, forceDeleteQuestion);

router.get('/:id', protect, getQuestion);

// Admin routes
router.get('/', protect, adminOnly, getAllQuestions);

module.exports = router;