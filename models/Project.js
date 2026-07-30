const mongoose = require('mongoose');

// Schema for individual test cases
const TestCaseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Test case title is required'], 
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'] 
  },
  type: { 
    type: String, 
    enum: {
      values: ['Functional', 'Edge Case', 'Negative', 'Boundary Value', 'API'],
      message: '{VALUE} is not a valid test type'
    }, 
    required: true 
  },
  steps: { 
    type: [String], 
    default: [],
    validate: [arrayLimit, 'Steps list exceeds maximum limit of 20 items']
  },
  expectedResult: { 
    type: String, 
    required: [true, 'Expected result is required'],
    trim: true,
    maxlength: [1000, 'Expected result text too long']
  },
  status: { 
    type: String, 
    enum: ['Untested', 'Pass', 'Fail'], 
    default: 'Untested' 
  }
});

function arrayLimit(val) {
  return val.length <= 20;
}

// Schema for bugs linked to failed test cases
const BugSchema = new mongoose.Schema({
  testCaseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null 
  },
  title: { 
    type: String, 
    required: [true, 'Bug title is required'], 
    trim: true,
    maxlength: [200, 'Bug title cannot exceed 200 characters'] 
  },
  description: { 
    type: String, 
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  severity: { 
    type: String, 
    enum: ['Critical', 'Major', 'Minor', 'Low'], 
    default: 'Major' 
  },
  priority: { 
    type: String, 
    enum: ['P1', 'P2', 'P3', 'P4'], 
    default: 'P2' 
  },
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'], 
    default: 'Open' 
  },
  screenshotUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Master Project schema
const ProjectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  requirementText: { 
    type: String, 
    required: true,
    maxlength: [5000, 'Requirement text cannot exceed 5000 characters'] 
  },
  testCases: [TestCaseSchema],
  bugs: [BugSchema]
}, { timestamps: true });

// Index for query performance optimization
ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);

