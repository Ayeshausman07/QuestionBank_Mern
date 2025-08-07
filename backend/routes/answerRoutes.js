const express = require('express');
const router = express.Router();
const {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
} = require('../controllers/answerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin routes
// router.post('/:questionId', protect, adminOnly, createAnswer);
router.put('/:id', protect, adminOnly, updateAnswer);
router.post('/:questionId', protect, createAnswer);
router.delete('/:id', protect, adminOnly, deleteAnswer);
router.patch('/:id/accept', protect, acceptAnswer); 

module.exports = router;