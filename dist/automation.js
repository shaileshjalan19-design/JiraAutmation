"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const jira_1 = require("./jira");
const generator_1 = require("./generator");
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
// Helper to strip markdown code fences if Gemini wraps its code block
function cleanGeneratedCode(code) {
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
        await (0, jira_1.moveTask)(issueKey, 'In Progress');
        // 2. Fetch Description from Jira
        const description = await (0, jira_1.getTaskDescription)(issueKey);
        console.log(`Fetched requirements from Jira (${issueKey}):\n`, description);
        // 3. Generate test script via generator.ts using Gemini
        console.log('Generating Playwright script via Gemini...');
        let testCode = await (0, generator_1.generateTestCode)(description);
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
        (0, node_child_process_1.execSync)(`npx playwright test ${specFileName}`, { stdio: 'inherit' });
        // 5. Update Jira on success
        await (0, jira_1.updateDescription)(issueKey, `Test Passed: Generated and verified via Playwright.`);
        await (0, jira_1.moveTask)(issueKey, 'Done');
        console.log(`Successfully completed task ${issueKey}.`);
    }
    catch (error) {
        console.error(`\n[ERROR] Automation failed for ${issueKey}:`, error.message || error);
        // Update Jira on failure
        await (0, jira_1.updateDescription)(issueKey, `Test Execution Failed:\n\`\`\`\n${error.message || error}\n\`\`\``);
    }
}
runAutomation();
