const Answer = require('../models/Answer');
const Question = require('../models/Question');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create an answer
// @route   POST /api/answers/:questionId
// @access  Private/Admin
exports.createAnswer = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    res.status(400);
    throw new Error('Please add answer content');
  }

  const question = await Question.findById(req.params.questionId);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const answer = await Answer.create({
    content,
    question: question._id,
    user: req.user._id,
  });

  // Add answer to question
  question.answers.push(answer._id);
  await question.save();

  res.status(201).json(answer);
});

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private/Admin
exports.updateAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  const updatedAnswer = await Answer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json(updatedAnswer);
});

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private/Admin
exports.deleteAnswer = asyncHandler(async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      res.status(404);
      throw new Error('Answer not found');
    }

    // Remove answer from question's answers array
    await Question.findByIdAndUpdate(
      answer.question,
      { $pull: { answers: answer._id } },
      { new: true }
    );

    // Delete the answer
    await Answer.deleteOne({ _id: answer._id });

    res.json({ success: true });
  } catch (error) {
    console.error('Detailed error in deleteAnswer:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user?._id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({
      success: false,
      error: 'Failed to delete answer',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Accept answer
// @route   PATCH /api/answers/:id/accept
// @access  Private
exports.acceptAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id).populate('question');

  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  // Check if user owns the question
  if (answer.question.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to accept this answer');
  }

  // Unaccept any previously accepted answers for this question
  await Answer.updateMany(
    { question: answer.question._id, _id: { $ne: answer._id } },
    { $set: { isAccepted: false } }
  );

  // Accept this answer
  answer.isAccepted = true;
  await answer.save();

  res.json(answer);
});