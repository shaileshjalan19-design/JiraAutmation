import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'node:buffer';

// HARDCODED CONFIGURATION - Replace with your actual credentials
const JIRA_BASE_URL = 'add your jira url';
const JIRA_EMAIL = 'add email id'; 
const JIRA_API_TOKEN = 'add Jira token';


console.log('Jira Base URL initialized to:', JIRA_BASE_URL);

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

const jiraInstance: AxiosInstance = axios.create({
  baseURL: `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3`,
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const getToDoTasks = async (projectKey: string) => {
  try {
    const jql = `project = "${projectKey}" AND status = "To Do"`;
    const response = await jiraInstance.get('/search', { params: { jql, fields: 'summary,description,labels,status' } });
    return response.data.issues;
  } catch (error) {
    console.error('Error fetching To Do tasks:', error);
    throw error;
  }
};

export const getTaskDescription = async (issueKey: string): Promise<string> => {
  try {
    const response = await jiraInstance.get(`/issue/${issueKey}`, { params: { fields: 'description' } });
    const description = response.data.fields.description;
    
    if (!description || !description.content) return '';
    return description.content
      .map((node: any) => node.content?.map((c: any) => c.text).join(' '))
      .join('\n');
  } catch (error) {
    console.error(`Error fetching description for ${issueKey}:`, error);
    throw error;
  }
};

export const moveTask = async (issueKey: string, transitionName: string) => {
  try {
    const transitions = await jiraInstance.get(`/issue/${issueKey}/transitions`);
    const transition = transitions.data.transitions.find((t: any) => t.name === transitionName);
    
    if (!transition) throw new Error(`Transition ${transitionName} not found`);
    
    await jiraInstance.post(`/issue/${issueKey}/transitions`, { transition: { id: transition.id } });
    console.log(`Transitioned ${issueKey} to ${transitionName}`);
  } catch (error) {
    console.error(`Error moving task ${issueKey}:`, error);
    throw error;
  }
};

export const updateDescription = async (issueKey: string, appendText: string) => {
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
  } catch (error) {
    console.error(`Error updating description for ${issueKey}:`, error);
    throw error;
  }
};
