import { getTaskDescription, moveTask, updateDescription } from './jira';
import { generateTestCode } from './generator';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

// Helper to strip markdown code fences if Gemini wraps its code block
function cleanGeneratedCode(code: string): string {
  return code
    .replace(/^```(?:javascript|typescript|js|ts)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

async function runAutomation() {
  const issueKey = process.argv[2] || 'KAN-5';
  const specFileName = `tests/${issueKey.toLowerCase()}.spec.js`;

  console.log(`Starting dynamic automation pipeline for ${issueKey}...`);

  try {
    // 1. Move ticket to In Progress
    await moveTask(issueKey, 'In Progress');

    // 2. Fetch Description from Jira
    const description = await getTaskDescription(issueKey);
    console.log(`Fetched requirements from Jira (${issueKey}):\n`, description);

    // 3. Generate test script via generator.ts using Gemini
    console.log('Generating Playwright script via Gemini...');
    let testCode = await generateTestCode(description);
    
    // Clean code formatting (removes ```javascript wrappers if present)
    testCode = cleanGeneratedCode(testCode);

    // Ensure tests directory exists
    if (!fs.existsSync('tests')) {
      fs.mkdirSync('tests', { recursive: true });
    }

    // Write generated code to test file
    fs.writeFileSync(specFileName, testCode, 'utf-8');
    console.log(`Created spec file: ${specFileName}`);

    // 4. Trigger Playwright execution
    console.log(`Executing test: ${specFileName}...`);
    execSync(`npx playwright test ${specFileName}`, { stdio: 'inherit' });

    // 5. Update Jira on success
    await updateDescription(issueKey, `Test Passed: Generated and verified via Playwright.`);
    await moveTask(issueKey, 'Done');
    console.log(`Successfully completed task ${issueKey}.`);

  } catch (error: any) {
    console.error(`\n[ERROR] Automation failed for ${issueKey}:`, error.message || error);
    
    // Update Jira on failure
    await updateDescription(
      issueKey, 
      `Test Execution Failed:\n\`\`\`\n${error.message || error}\n\`\`\``
    );
  }
}

runAutomation();