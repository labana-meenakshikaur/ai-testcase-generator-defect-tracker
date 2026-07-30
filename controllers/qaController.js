const { GoogleGenAI } = require('@google/genai');
const Project = require('../models/Project');

// Smart Fallback Generator (Runs if Google API quota is exceeded)
const generateFallbackCases = (requirement) => [
  {
    title: `Verify happy path execution for: ${requirement.slice(0, 30)}...`,
    type: 'Functional',
    steps: [
      'Navigate to the relevant feature module.',
      `Enter valid input for requirement: "${requirement.slice(0, 40)}"`,
      'Click the primary submit button.'
    ],
    expectedResult: 'System processes request successfully without errors.'
  },
  {
    title: 'Verify input validation and empty field submission',
    type: 'Negative',
    steps: [
      'Navigate to the feature form.',
      'Leave required fields blank.',
      'Attempt to submit.'
    ],
    expectedResult: 'System displays validation warnings and blocks form submission.'
  },
  {
    title: 'Verify high-concurrency / edge case handling',
    type: 'Edge Case',
    steps: [
      'Trigger multiple rapid submissions sequentially.',
      'Check network logs and backend database response.'
    ],
    expectedResult: 'System handles rate limits gracefully without duplicating records.'
  }
];

exports.generateTestCases = async (req, res) => {
  try {
    const { requirementText, projectName } = req.body;

    if (!requirementText || !requirementText.trim()) {
      return res.status(400).json({ success: false, message: 'Requirement text is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedCases = [];

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const promptText = `
          You are a QA Lead. Generate test cases for the following user story:
          "${requirementText.trim()}"

          Return ONLY a raw JSON array of test objects without markdown backticks.
          Schema:
          [
            {
              "title": "Scenario title",
              "type": "Functional",
              "steps": ["Step 1", "Step 2"],
              "expectedResult": "Expected outcome"
            }
          ]
        `;

        // Updated to the current standard model: gemini-2.5-flash
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText
        });

        let rawText = response.text() || '[]';
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        generatedCases = JSON.parse(rawText);
      } catch (apiError) {
        console.warn('⚠️ Gemini API Quota Limit Hit. Activating Smart QA Fallback Engine...');
        generatedCases = generateFallbackCases(requirementText);
      }
    } else {
      generatedCases = generateFallbackCases(requirementText);
    }

    const newProject = new Project({
      name: projectName?.trim() || 'Untitled QA Suite',
      requirementText: requirementText.trim(),
      testCases: generatedCases
    });

    await newProject.save();
    return res.status(201).json({ success: true, project: newProject });

  } catch (error) {
    console.error('[QA Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

exports.updateTestStatus = async (req, res) => {
  try {
    const { projectId, testCaseId, status } = req.body;
    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, "testCases._id": testCaseId },
      { $set: { "testCases.$.status": status } },
      { new: true }
    );
    return res.json({ success: true, project: updatedProject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logBug = async (req, res) => {
  try {
    const { projectId, testCaseId, title, description, severity, priority } = req.body;
    const bugPayload = { testCaseId, title, description, severity, priority };
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $push: { bugs: bugPayload } },
      { new: true }
    );
    return res.status(201).json({ success: true, project: updatedProject });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};