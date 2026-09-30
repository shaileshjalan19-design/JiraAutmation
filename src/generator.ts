import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey =  "add api token for gemini,claude,etc";

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not configured in .env');
}

const genAI = new GoogleGenerativeAI(apiKey);

// List of fallback models in order of preference
const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest', //you can add here which model you are using to gentrate the testcase
  'gemini-3.1-flash-lite'
];

/**
 * Generates Playwright JavaScript test code strictly based on Jira task requirements.
 *
 * @param jiraDescription - Requirements string fetched from the Jira ticket.
 * @returns Cleaned, executable JavaScript Playwright test code.
 */
export async function generateTestCode(jiraDescription: string): Promise<string> {
  const prompt = `
You are an expert Playwright automation engineer.
Generate a Playwright JavaScript test ONLY for the following requirements:
"${jiraDescription}"

STRICT GUIDELINES:
1. STRICT SCOPE BOUNDARIES: Implement ONLY the steps explicitly listed in the Jira description. DO NOT invent extra steps (such as adding 'To' destinations, picking flight dates, clicking search, or verifying search results) unless directly requested in the Jira description.
2. DISMISS POPUPS: Handle MakeMyTrip modals safely at the start using a try/catch block (e.g. section span or span.commonModal__close).
3. 'FROM' / 'TO' INPUT LOCATORS FOR MAKEMYTRIP:
   - Click container label first: label[for="fromCity"] or label[for="toCity"]
   - Fill city name: page.getByPlaceholder('From') or page.getByPlaceholder('To')
   - To select top suggestion: wait 1 second and call await page.keyboard.press('Enter')
   - If requirement says "don't select the first suggestion": wait for suggestions list (page.locator('ul.react-autosuggest__suggestions-list li, li[role="option"]')) and click index 1 (await suggestions.nth(1).click()).
4. NO UNNECESSARY WAITS: Avoid using page.waitForSelector() or networkidle navigation where possible.
5. SYNTAX RULES:
   - Import strictly: const { test, expect } = require('@playwright/test');
   - Do NOT wrap code in markdown code fences (\`\`\`javascript).
   - Do NOT call test.use() or chromium.launch().
`;

  let responseText = '';
  let lastError: any = null;

  // Iterate over supported model aliases with fallback handling
  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`Attempting code generation using model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      responseText = response.text();
      
      if (responseText) break; // Successfully generated code
    } catch (err: any) {
      lastError = err;
      console.warn(`[Model ${modelName} Failed]: ${err.message || err}. Trying next model...`);
    }
  }

  if (!responseText) {
    throw new Error(`All Gemini model attempts failed. Last error: ${lastError?.message || lastError}`);
  }

  // Programmatically sanitize code output
  let code = responseText
    .replace(/^```[a-z]*\n/gi, '')
    .replace(/\n```$/g, '')
    .replace(/test\.use\(\{[\s\S]*?\}\);?/g, '')
    .replace(/const\s+browser\s*=\s*await\s+chromium\.launch\([\s\S]*?\);?/g, '')
    .trim();

  return code;
}

// Local testing execution block
if (require.main === module) {
  (async () => {
    const sampleDescription =
      '1.got to this website :https://www.makemytrip.com/flights/\n2.enter the from as Delhi.\n3.end the testcase.';
    console.log('Testing generateTestCode with sample description...\n');
    try {
      const generatedCode = await generateTestCode(sampleDescription);
      console.log('--- GENERATED TEST CODE ---');
      console.log(generatedCode);
    } catch (error) {
      console.error('Error generating code:', error);
    }
  })();
}