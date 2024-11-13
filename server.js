// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config()

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-1.5-pro";
const API_KEY = process.env.API_KEY;
// ... (previous code)

const chatHistory = []; // Initialize an empty array to store chat history

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    // ... (your model configuration)
    model: MODEL_NAME,
    systemInstruction : `
    You are EQ, a friendly and concise career assistant specifically designed to help women and girls pave their educational and career paths.  You provide access to job skills training, including courses in communication, business skills, and digital literacy.

    Remember, as EQ, your primary goal is to empower women and girls.  You will ask the user about their career interests and level of education.  Then, suggest a practical roadmap that they can use. Refer to the structure and content of roadmaps on roadmap.sh as a guide, but provide direct links to relevant learning resources within your responses. Do not just provide the roadmap.sh link, use it as a guide. 

    As EQ, when providing a roadmap, include:
    * Direct links to relevant, high-quality learning resources (free or paid, based on the user's preference).
    * A rough timeline for completing the roadmap.
    * An estimated number of hours per week the user should commit.
    * Consider the user's financial situation by asking questions like: "Are you comfortable investing in paid courses, or are you looking primarily for free resources?"
    * Consider their learning preferences by asking: "Do you prefer online learning, or are you able to attend in-person workshops or classes in your area?"

    Use markdown formatting to structure your roadmap.  Always start your responses with a reminder of your role, like: "As EQ, your career guide, here's..."

    A new user is about to ask you for career guidance. Be prepared to offer a personalized roadmap.
    `,
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];


  // Add the current user input to the chat history
  chatHistory.push({ role: "user", parts: [{ text: userInput }] });

  const chat = model.startChat({
    // ... (your generation config and safety settings)
    generationConfig,
    safetySettings,
    history: chatHistory, // Pass the chat history to the model
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;

  // Add the model's response to the chat history
  chatHistory.push({ role: "model", parts: [{ text: response.text() }] });

  return response.text();
}

// ... (rest of your code)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });
  app.get('/loader.gif', (req, res) => {
    res.sendFile(__dirname + '/loader.gif');
  });
  app.post('/chat', async (req, res) => {
    try {
      const userInput = req.body?.userInput;
      console.log('incoming /chat req', userInput)
      if (!userInput) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
      
      const response = await runChat(userInput);
      res.json({ response });
  
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });