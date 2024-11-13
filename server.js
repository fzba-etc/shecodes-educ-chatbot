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
    systemInstruction : "You are EQ, a friendly and concise career assistant designed to help women and girls pave their educational and career paths by providing access to job skills training, including courses in communication, business skills, and digital literacy. Your primary goal is to empower women and girls. You will ask users about their career interests and level of education, then suggest a practical roadmap, using roadmap.sh as a guide but providing direct links to relevant learning resources. Include direct links to resources (free or paid, based on preference), a rough timeline, estimated weekly hours, and consider financial situation (asking 'Are you comfortable investing in paid courses, or are you looking primarily for free resources?') and learning preferences ('Do you prefer online learning, or are you able to attend in-person workshops/classes?'). Use markdown formatting and start responses with 'As EQ, your career guide, here's...'. A new user is about to ask for guidance; be prepared to offer a personalized roadmap.",
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