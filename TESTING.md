# AutoSpec QA  Quality Assurance & Testing Strategy

This document details the comprehensive Quality Assurance (QA) strategy, test coverage framework, and test case specifications engineered for **AutoSpec QA: AI-Powered Test Suite Synthesizer & Defect Tracker**.

---

## 1. Scope

### 1.1 In-Scope
* **AI Test Suite Generation & Schema Enforcement:**
  * Strict JSON Schema validation using the Google Gen AI SDK (`@google/genai`) with Gemini 1.5 Flash.
  * Validation of input requirement texts, string length constraints (up to 5000 characters), and empty payload rejection.
  * System resilience against malformed AI responses or invalid scenario array structures.
* **Database State & Atomic Operations:**
  * Execution of atomic positional updates (`$set`) for updating individual test case pass/fail statuses.
  * Execution of atomic document pushes (`$push`) when logging defect tickets into the embedded bugs array under a specific project.
  * Mongoose schema constraints validation (e.g., test case step array limits capped at 20 items, enum constraints for severity, priority, and test types).
* **UI & Client-Side Execution:**
  * Optimistic UI update validation during status toggles with rollback state restoration on network or API failure.
  * Defect ticket creation modal functionality, pre-populating test case IDs, and validating required fields.

### 1.2 Out-of-Scope
* **Google Gemini API Server Infrastructure:** Uptime, network latency, or unexpected rate-limiting behavior originating directly from Google Cloud infrastructure.
* **Browser-Specific CSS Rendering:** Pixel-perfect visual layout rendering across legacy web browsers or non-standard viewport sizes.

---

## 2. Test Approach & Methodologies

To ensure full system reliability, security, and data consistency, the testing strategy for **AutoSpec QA** utilizes four primary testing methodologies:

### 2.1 Functional Testing (Black-Box)
* **Objective:** Verify that every controller endpoint and UI interaction operates according to specification without reliance on underlying implementation details.
* **Execution:**
  * Executing unit and API tests against backend endpoints (`POST /api/qa/generate`, `PATCH /api/qa/test-status`, `POST /api/qa/bugs`) to confirm expected HTTP status codes, structured JSON responses, and validation error handles.
  * Verifying user workflow states, such as submitting a user story, generating structured test cases, marking a case as failed, and opening a defect modal.

### 2.2 Integration Testing
* **Objective:** Validate end-to-end communication across architectural layers: *React Client -> Express API Controllers -> `@google/genai` SDK -> MongoDB (Mongoose ORM)*.
* **Execution:**
  * Testing the complete AI generation pipeline by passing user stories through Express controllers, enforcing `responseSchema` parameters, and ensuring the resulting JSON array persists into MongoDB as embedded `testCases` subdocuments.
  * Confirming that defect tickets logged via `POST /api/qa/bugs` properly link the triggering `testCaseId` to the project document.

### 2.3 Performance & Stress Testing
* **Objective:** Benchmark system stability, database write concurrency, and API responsiveness under load.
* **Execution:**
  * Executing load scripts via **k6** and **Postman/Newman** within a Linux/UNIX CLI environment to stress test concurrent status updates (`PATCH /api/qa/test-status`) and evaluate race condition handling.
  * Monitoring MongoDB connection pool health and ensuring p95 API response times for non-AI database writes remain under 150ms.

### 2.4 Regression Testing
* **Objective:** Guarantee that changes to database models, Mongoose schemas, or controller functions do not break existing project records or defect tracking workflows.
* **Execution:**
  * Executing automated terminal test scripts before every deployment to verify schema validators, default values, and API error handling remain intact.

---

## 3. Test Environment & Tools

The testing stack is structured for automated CLI regression, API contract assertion, and performance benchmarking:

### 3.1 Operating & Runtime Environment
* **OS Environment:** Linux/UNIX (Ubuntu / Bash) for terminal scripting, process monitoring, and CLI-driven test runs.
* **Runtime Stack:** Node.js (v18+) and npm ecosystem.

### 3.2 Unit & Integration Testing Frameworks
* **Jest:** Primary JavaScript testing framework for automated unit assertions, model validation, and controller logic checks.
* **Supertest:** HTTP integration library paired with Jest to test Express endpoints directly without spinning up independent HTTP servers.

### 3.3 API Testing, Automation & Documentation
* **Postman:** Client used to create automated API test collections for endpoint assertions and payload validation.
* **Newman CLI:** Command-line collection runner to execute automated Postman API test suites directly inside a Linux/UNIX terminal.
* **Swagger UI / OpenAPI:** Visual API contract specification framework for interactive endpoint verification.

### 3.4 Performance, Load & Stress Testing
* **Apache JMeter / k6:** Load generation tools used to test concurrent atomic writes (`$set` and `$push`), benchmark MongoDB connection pools, and assess system resilience.

---

## 4. Entry and Exit Criteria

To maintain code health and project quality, the execution pipeline enforces strict Entry and Exit thresholds:

### 4.1 Entry Criteria (Pre-requisites before running tests)
* **Codebase Readiness:** Backend Node/Express code builds cleanly with zero syntax or module resolution errors.
* **Environment Setup:** `.env` variables (`PORT`, `MONGODB_URI`, `GEMINI_API_KEY`) are properly loaded in the runtime environment.
* **Database State:** MongoDB instance (Local or Atlas) is running, reachable, and seeded with clean test collections.
* **Tooling Readiness:** Jest, Supertest, Postman/Newman, and k6 are installed and operational.

### 4.2 Exit Criteria (Conditions for release sign-off)
* **Execution Completion:** 100% execution of all defined functional, boundary, negative, and integration test scenarios.
* **Pass Rate:** 100% pass rate on core schema enforcement, AI parsing, and atomic database operations; minimum 90% overall suite pass rate.
* **Defect Resolution:** Zero critical (P1/Blocker) bugs open in the defect tracker.
* **Performance Benchmark:** Database updates return sub-150ms p95 latency without connection pool exhaustion or unhandled promise rejections.

---

## 5. Risk Assessment & Mitigation

| Risk Area | Potential Threat / Failure | Impact Level | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **AI Schema Violation / Outage** | Gemini API rate limiting, network downtime, or malformed JSON payload generation. | High | Enforce strict `responseSchema` with `@google/genai`, wrap generation logic in `try-catch` blocks returning HTTP 500 error messages, and utilize mocked AI fixtures during regression test runs. |
| **Concurrent State Race Conditions** | Multiple status update requests on the same project overwriting each other's test case states. | Medium | Utilize atomic MongoDB positional updates (`$set` with `"testCases.$.status"`) rather than reading/writing full array documents. |
| **Payload Overload / Buffer Overflow** | Unusually massive requirement texts causing memory bloat or database validation crashes. | High | Set explicit string length caps on `requirementText` (max 5000 characters) at both Mongoose schema and Express controller levels. |

---

## 6. Detailed Test Case Matrix

The following structured test case matrix validates core platform capabilities across Positive, Negative, Boundary, and Integration scenarios.

| Test Case ID | Feature / Module | Test Title / Summary | Test Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_GEN_001** | AI Generation | Verify successful test suite generation with Gemini structured JSON schema | Functional (Positive) | Gemini API key is valid. Express server is running. | 1. Send `POST` to `/api/qa/generate`.<br>2. Pass valid `projectName` and `requirementText`.<br>3. Inspect response structure and MongoDB record. | `{"projectName": "Auth Module", "requirementText": "Users must login via Email and Password."}` | API returns `HTTP 201 Created`. Response contains a project document with an array of structured test cases adhering to `TestCaseSchema`. | API returned `HTTP 201 Created` with valid array of test cases. | **PASS** |
| **TC_GEN_002** | AI Generation | Reject generation request when requirement text is empty | Negative / Boundary | Express server is running. | 1. Send `POST` to `/api/qa/generate`.<br>2. Pass empty string or whitespace in `requirementText`.<br>3. Observe HTTP status code. | `{"projectName": "Test Project", "requirementText": "   "}` | Controller validation catches empty string and returns `HTTP 400 Bad Request` without invoking Gemini API. | Returned `HTTP 400 Bad Request` with message "Requirement text is required." | **PASS** |
| **TC_STATUS_003** | Atomic Updates | Verify atomic positional update (`$set`) for test case status | Integration (Positive) | Project exists in MongoDB with a test case having `status: 'Untested'`. | 1. Send `PATCH` to `/api/qa/test-status`.<br>2. Pass valid `projectId`, `testCaseId`, and `status: 'Pass'`.<br>3. Verify DB record. | `{"projectId": "65a...", "testCaseId": "65b...", "status": "Pass"}` | API performs atomic `$set` update, returns `HTTP 200 OK`, and test case status changes to `'Pass'`. | Database updated atomically; returned `HTTP 200 OK`. | **PASS** |
| **TC_BUG_004** | Defect Tracker | Atomically append bug ticket (`$push`) linked to failed test case | Functional (Positive) | Project exists in MongoDB. | 1. Send `POST` to `/api/qa/bugs`.<br>2. Pass valid `projectId`, `testCaseId`, `title`, `severity`, and `priority`. | `{"projectId": "65a...", "testCaseId": "65b...", "title": "Defect in Auth", "severity": "Major", "priority": "P2"}` | API returns `HTTP 201 Created`. Defect is pushed into the project's `bugs` array with linked `testCaseId`. | Bug pushed into array successfully; returned `HTTP 201 Created`. | **PASS** |
| **TC_UI_005** | Optimistic UI | Restore original UI state when status update network request fails | Integration (Negative) | React dashboard rendered. Server is unreachable or returns HTTP 500. | 1. Click 'PASS' on a test case.<br>2. Observe state update.<br>3. Simulate server error response.<br>4. Observe state rollback. | Simulated `HTTP 500 Internal Server Error` response on `PATCH /api/qa/test-status`. | React component catches error block and rolls back test case status state to pre-click value (`prevProject`). | UI state reverted seamlessly upon API error catch. | **PASS** |
