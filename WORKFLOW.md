# Jira Automation Workflow: AI-Driven Playwright Testing

This document outlines the end-to-end automation pipeline for integrating Jira with Playwright via the AI Planner.

## Workflow Overview

1.  **Fetch Ticket Details:** Use Jira REST API v3 (`src/jira.ts`) to retrieve issue details for a specific project/ticket.
2.  **Verify Status:** Check if the ticket status is "To Do". If so, transition it to "In Progress".
3.  **Extract Content:** Read the Jira description and extract testing requirements using ADF parsing.
4.  **Test Generation:** Leverage the Cursor AI planner to transform the extracted requirements into a functional Playwright `.spec.js` test file.
5.  **Execution:** Trigger the Playwright MCP server to execute the newly generated test file.
6.  **Reporting:** 
    *   Append the final test execution results (success/failure) back to the Jira issue description.
    *   Transition the Jira ticket status to "Done" if all tests pass.

## Implementation Details

### Jira API Integration (`src/jira.ts`)
*   Uses Basic Auth (Email + API Token).
*   Functions: `getToDoTasks`, `getTaskDescription`, `moveTask`, `updateDescription`.

### AI Automation Planner
*   The system uses the AI Planner to orchestrate the transition from requirements to automated code.
*   Playwright MCP provides the browser execution capabilities.

## Operational Sequence
1.  **Automation Start:** Orchestrator calls `getToDoTasks`.
2.  **Jira -> Code:** AI reads description -> generates `tests/[ticket-key].spec.js`.
3.  **Run:** Execute `npx playwright test tests/[ticket-key].spec.js`.
4.  **Feedback:** Log results back to Jira issue and finalize status.
