# Retell AI Phone Agent

## Overview
An AI-powered phone agent built with Retell AI that can handle incoming calls autonomously. This solution aims to provide a natural conversation experience while replacing traditional human phone operators.

## Prerequisites
- Node.js and Yarn installed
- Retell AI account
- OpenAI API key
- Basic understanding of WebSocket connections

## Quick Start

### 1. Installation
```bash
yarn install
```

### 2. Configuration
1. Copy `.env.example` to `.env`
2. Fill in the required environment variables. You can get them from your Retell AI and OpenAI account.
   - `RETELL_API_KEY`
   - `OPENAI_LLM_MODEL`
   - `VOICE_ID`
   - `OPENAI_APIKEY`

### 3. Start the server
```bash
yarn start:dev
```

### 4. Retell AI Setup
1. Log in to [Retell AI Dashboard](https://retellai.com)
2. Create a new agent:
   - Click "Create Agent" button
   - Select "Custom LLM" as the agent type
3. Configure the agent:
   - Set the WebSocket URL to your deployed backend service
   - Configure webhook settings with your backend API endpoint
   - Note down the Agent ID (visible in the top-left corner)

## Testing

### Dashboard Testing
1. Navigate to your agent in the Retell AI Dashboard
2. Click the "Test" button
3. Enable your microphone
4. Start speaking - the AI agent should respond accordingly

### React Application Testing
1. Ensure your React application is running
2. Provide the Agent ID in your configuration
   ```javascript
   const agentId = 'your_agent_id_here';
   ```
3. Test the voice interaction through your React interface
4. Code for the React application [react-app](https://github.com/RetellAI/retell-frontend-reactjs-demo/tree/main/frontend_demo)


## Local Development with ngrok

### Setting up ngrok
1. Install ngrok from [ngrok.com](https://ngrok.com)

2. Start your local server (typically on port 8080):
   ```bash
   yarn start:dev
   ```

3. In a new terminal, create an ngrok tunnel to your local server:
   ```bash
   ngrok http 8080
   ```

4. Copy the generated HTTPS URL (e.g., `https://your-tunnel.ngrok.io`)

### Configuring Retell AI with ngrok
1. In the Retell AI Dashboard, update your agent's configuration:
   - Set WebSocket URL to: `wss://your-tunnel.ngrok.io`
   - Update webhook URL to: `https://your-tunnel.ngrok.io/webhook`

> **Note:** The ngrok URL changes each time you restart ngrok unless you have a paid account. Remember to update the URLs in your Retell AI dashboard when this happens.

