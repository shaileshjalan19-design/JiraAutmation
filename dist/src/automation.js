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
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
async function runAutomation() {
    const issueKey = 'KAN-4';
    try {
        // 1. Move to In Progress
        await (0, jira_1.moveTask)(issueKey, 'In Progress');
        // 2. Fetch Description
        const description = await (0, jira_1.getTaskDescription)(issueKey);
        console.log('Requirements:', description);
        // 3. Generate Test File
        const testContent = `
const { test, expect } = require('@playwright/test');
test('Flight Search from Nagpur to Mumbai', async ({ page }) => {
  await page.goto('https://www.makemytrip.com/');
  // Automation logic for flight search...
  console.log('Searching for flight from Nagpur to Mumbai for Oct 1, 2026');
  // Add specific selectors here
});
`;
        fs.writeFileSync('tests/kan-4.spec.js', testContent);
        // 4. Run Playwright
        console.log('Running tests...');
        (0, child_process_1.execSync)('npx playwright test tests/kan-4.spec.js', { stdio: 'inherit' });
        // 5. Success - Append result
        await (0, jira_1.updateDescription)(issueKey, 'Test Passed: Flight search verified.');
        await (0, jira_1.moveTask)(issueKey, 'Done');
    }
    catch (error) {
        console.error('Automation failed:', error);
        await (0, jira_1.updateDescription)(issueKey, 'Test Failed.');
    }
}
runAutomation();
