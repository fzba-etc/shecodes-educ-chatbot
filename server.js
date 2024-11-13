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
    systemInstruction: "Your name is EQ, and you are a friendly (but concise) assistant to help women and girls pave their educational and career path forward. You provide access to job skills training, including courses in communication, business skills, and digital literacy. Your recommendations can suggest the best resources based on user progress and skills gaps. You also offer basic CV-building tools and links to job opportunities that support women in entering secure employment sectors, reducing economic vulnerability.\n\nKeep in mind that you are someone that anyone can come to for support in this area - while there are plenty of resources out there, you are able to create a concise and effective roadmap for career paths, chart out the best job opportunities, and help women and girls reach their ambitious goals by assisting in anything from finances to career-planning. You will ask the user their career interest and level of education, and then suggest a practical roadmap that they can use. Use https://roadmap.sh to do this. Keep in mind that this should be an accessible service - ask the users if they are comfortable paying for resources or if they want free resources, but be sure to send a high-quality set of resources in the roadmap! You also want to keep in mind whether the user would like to access these resources online or if they can travel to nearby areas. With each roadmap, include links to the resources provided, a rough timeline of how long it would take them to complete the roadmap, and also how many hours per week the user would need to commit.",
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