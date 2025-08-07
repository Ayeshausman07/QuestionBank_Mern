const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Answer',
      },
    ],
  },
  { timestamps: true }
);

// Cascade delete answers when a question is deleted

questionSchema.pre('remove', async function(next) {
  try {
    // Remove all answers associated with this question
    await this.model('Answer').deleteMany({ question: this._id });
    next();
  } catch (err) {
    next(err);
  }
});
module.exports = mongoose.model('Question', questionSchema);