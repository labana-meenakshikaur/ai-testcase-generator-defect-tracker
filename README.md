# AutoSpec QA: AI-Powered Test Suite Synthesizer & Defect Tracker

## Overview
**AutoSpec QA** is a modern full-stack web application designed to streamline Quality Assurance workflows. By leveraging the **Google Gen AI SDK (Gemini 1.5 Flash)** with strict **Structured Outputs (JSON Schema)**, AutoSpec QA automatically parses feature requirements and user stories to generate structured, production-grade test suites covering functional, edge-case, boundary-value, negative, and API test scenarios. The platform provides a real-time management dashboard where testers can track execution status, perform optimistic UI updates, and file defect tickets linked directly to failed test cases.

---

## Key Features
* **AI Test Case Synthesis:** Generates complete test suites with titles, categorized types, execution steps, and expected behavior using Gemini AI.
* **Guaranteed Schema Adherence:** Enforces strict JSON Schema response parameters via the Gemini API, eliminating conversational text and output format errors.
* **Atomic Database Execution:** Utilizes MongoDB document modeling and atomic updates (`$set`, `$push`) to prevent race conditions during concurrent test status changes and defect logging.
* **Optimistic UI State:** Built with React and Tailwind CSS to offer instantaneous visual feedback during test pass/fail updates with fallback rollback error handling.
* **Integrated Defect Tracker:** Logs defects linked directly to test case IDs with configurable severity, priority levels, and reproduction notes.

---

## Tech Stack
### Frontend
* **Framework:** React.js
* **Styling:** Tailwind CSS (Modern Dark Mode UI)
* **HTTP Client:** Axios

### Backend
* **Runtime:** Node.js & Express.js
* **Database:** MongoDB (Mongoose ODM)
* **AI Integration:** `@google/genai` (Google Gen AI SDK with `responseSchema` configuration)

---

## System Architecture & Data Flow
1. **User Requirement Submission:** The user inputs feature requirements and a project title via the React frontend dashboard.
2. **AI Processing:** The Express backend prompts Gemini 1.5 Flash with strict `Type.ARRAY` and `Type.OBJECT` schema parameters to guarantee structured JSON output.
3. **Database Storage:** Generated test cases are stored in MongoDB as embedded subdocuments inside a master `Project` schema.
4. **Execution & Defect Management:** The UI dynamically displays test cases, allowing status toggles and defect modal submission via atomic API operations.

---

## Database Schemas

### Project Schema (`models/Project.js`)
* **`name`**: String (Required)
* **`requirementText`**: String (Required)
* **`testCases`**: Array of `TestCaseSchema`
* **`bugs`**: Array of `BugSchema`

### Test Case Subdocument
* **`title`**: String
* **`type`**: Enum (`['Functional', 'Edge Case', 'Negative', 'Boundary Value', 'API']`)
* **`steps`**: Array of Strings (Limit: 20)
* **`expectedResult`**: String
* **`status`**: Enum (`['Untested', 'Pass', 'Fail']`)

### Bug Subdocument
* **`testCaseId`**: ObjectId (Refers to triggering test case)
* **`title`**: String
* **`description`**: String
* **`severity`**: Enum (`['Critical', 'Major', 'Minor', 'Low']`)
* **`priority`**: Enum (`['P1', 'P2', 'P3', 'P4']`)
* **`status`**: Enum (`['Open', 'In Progress', 'Resolved', 'Closed']`)

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/qa/generate` | Accepts requirement text, calls Gemini AI, creates project record. |
| `PATCH` | `/api/qa/test-status` | Atomic positional update (`$set`) for individual test pass/fail status. |
| `POST` | `/api/qa/bugs` | Atomic push (`$push`) to log a defect ticket under a specific project. |

---

## Environment Variables
Create a `.env` file in your root server directory and configure the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB database instance (Local or MongoDB Atlas)
* Google Gemini API Key

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/labana-meenakshikaur/ai-testcase-generator-defect-tracker.git
   cd ai-testcase-generator-defect-tracker
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd client
   npm install
   ```

4. **Run Application:**
   * Backend:
     ```bash
     npm run server
     ```
   * Frontend:
     ```bash
     cd client
     npm start
     ```

---

## Author
* **Labana Meenakshi Kaur**
