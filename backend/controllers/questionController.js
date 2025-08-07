const Question = require('../models/Question');
const Answer = require('../models/Answer');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const mongoose = require('mongoose');


exports.getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({ isPublic: true })
    .populate('user', 'name')
    .populate({
      path: 'answers',
      populate: {
        path: 'user',
        select: 'name',
      },
    })
    .sort({ createdAt: -1 });

  res.json(questions);
});


exports.getAllQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find()
    .populate('user', 'name email')
    .populate({
      path: 'answers',
      populate: {
        path: 'user',
        select: 'name',
      },
    })
    .sort({ createdAt: -1 });

  res.json(questions);
});

// @desc    Get logged in user's questions
// @route   GET /api/questions/my-questions
// @access  Private
exports.getMyQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({ user: req.user._id })
    .populate('user', 'name')
    .populate({
      path: 'answers',
      populate: {
        path: 'user',
        select: 'name',
      },
    })
    .sort({ createdAt: -1 });

  res.json(questions);
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
exports.getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('user', 'name')
    .populate({
      path: 'answers',
      populate: {
        path: 'user',
        select: 'name',
      },
    });

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

 
  if (
    !question.isPublic &&
    question.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(401);
    throw new Error('Not authorized to access this question');
  }

  res.json(question);
});

// @desc    Create a question
// @route   POST /api/questions
// @access  Private
exports.createQuestion = asyncHandler(async (req, res) => {
  const { title, description, isPublic } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Please add title and description');
  }

  const question = await Question.create({
    title,
    description,
    isPublic,
    user: req.user._id,
  });

  res.status(201).json(question);
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Check if user owns the question
  if (question.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to update this question');
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.json(updatedQuestion);
});

// In questionController.js
exports.forceDeleteQuestion = asyncHandler(async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('Invalid question ID');
    }

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    await Answer.deleteMany({ question: question._id }).session(session);
    await Question.deleteOne({ _id: question._id }).session(session);
    
    await session.commitTransaction();
    
    res.json({ success: true });
  } catch (error) {
    await session?.abortTransaction();
    console.error('Detailed error in forceDeleteQuestion:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user?._id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to force delete question',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
exports.deleteQuestion = asyncHandler(async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404);
      throw new Error('Question not found');
    }

    // Check if user owns the question or is admin
    if (question.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this question');
    }

    // Delete the question and its answers
    await Answer.deleteMany({ question: question._id });
    await Question.deleteOne({ _id: question._id });

    res.json({ success: true });
  } catch (error) {
    console.error('Detailed error in deleteQuestion:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user?._id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete question',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});