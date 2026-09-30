"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDescription = exports.moveTask = exports.getTaskDescription = exports.getToDoTasks = void 0;
const axios_1 = __importDefault(require("axios"));
// HARDCODED CONFIGURATION - Replace with your actual credentials
const JIRA_BASE_URL = 'https://shaileshjalan19.atlassian.net';
const JIRA_EMAIL = 'shaileshjalan19@gmail.com';
const JIRA_API_TOKEN = 'ATATT3xFfGF0q-B1R8cEBu-SfZ6ih-2A16ftGDek6cMO78l6aXYG8PGrephQlaKys1bAGQwmJQbfdGxRoAzYl_YCDoerdV_r6VQ1zf6r2AJzMKZiaK9VrKaHnuVtK6MIMWBrFGgWIzMg2rgdEc-DSpAHzx8bXDkEsAxaINSYIEdbbl01524x-yA=D1EB66FE';
console.log('Jira Base URL initialized to:', JIRA_BASE_URL);
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
const jiraInstance = axios_1.default.create({
    baseURL: `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3`,
    headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});
const getToDoTasks = async (projectKey) => {
    try {
        const jql = `project = "${projectKey}" AND status = "To Do"`;
        const response = await jiraInstance.get('/search', { params: { jql, fields: 'summary,description,labels,status' } });
        return response.data.issues;
    }
    catch (error) {
        console.error('Error fetching To Do tasks:', error);
        throw error;
    }
};
exports.getToDoTasks = getToDoTasks;
const getTaskDescription = async (issueKey) => {
    try {
        const response = await jiraInstance.get(`/issue/${issueKey}`, { params: { fields: 'description' } });
        const description = response.data.fields.description;
        if (!description || !description.content)
            return '';
        return description.content
            .map((node) => node.content?.map((c) => c.text).join(' '))
            .join('\n');
    }
    catch (error) {
        console.error(`Error fetching description for ${issueKey}:`, error);
        throw error;
    }
};
exports.getTaskDescription = getTaskDescription;
const moveTask = async (issueKey, transitionName) => {
    try {
        const transitions = await jiraInstance.get(`/issue/${issueKey}/transitions`);
        const transition = transitions.data.transitions.find((t) => t.name === transitionName);
        if (!transition)
            throw new Error(`Transition ${transitionName} not found`);
        await jiraInstance.post(`/issue/${issueKey}/transitions`, { transition: { id: transition.id } });
        console.log(`Transitioned ${issueKey} to ${transitionName}`);
    }
    catch (error) {
        console.error(`Error moving task ${issueKey}:`, error);
        throw error;
    }
};
exports.moveTask = moveTask;
const updateDescription = async (issueKey, appendText) => {
    try {
        const response = await jiraInstance.get(`/issue/${issueKey}`, { params: { fields: 'description' } });
        const currentDescription = response.data.fields.description
            ? JSON.parse(JSON.stringify(response.data.fields.description))
            : { type: 'doc', version: 1, content: [] };
        if (!currentDescription.content) {
            currentDescription.content = [];
        }
        currentDescription.content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: appendText }]
        });
        await jiraInstance.put(`/issue/${issueKey}`, { update: { description: [{ set: currentDescription }] } });
        console.log(`Updated description for ${issueKey}`);
    }
    catch (error) {
        console.error(`Error updating description for ${issueKey}:`, error);
        throw error;
    }
};
exports.updateDescription = updateDescription;
