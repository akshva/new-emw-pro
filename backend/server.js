// server.js
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const app = express();
const port = 3000;

// Initialize the GoogleGenAI client (uses GEMINI_API_KEY from .env)
const ai = new GoogleGenAI({}); 

// Middleware to parse JSON bodies and allow CORS for frontend development
app.use(express.json()); 
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); // Replace with your frontend dev URL
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// The core prompt to generate the e-waste quiz
const QUIZ_GENERATION_PROMPT = (numQuestions = 5) => `
Generate a multiple-choice quiz about E-waste for a website.
The quiz must have exactly ${numQuestions} questions.
Each question MUST have four options (A, B, C, D) and a single correct answer.
The entire response MUST be a single, valid JSON object that strictly follows this JSON schema.
Focus the questions on topics like: e-waste definition, toxic components (Lead, Mercury), proper disposal methods (recycling), and environmental impact.

JSON Schema:
{
  "type": "object",
  "properties": {
    "quiz": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "integer"},
          "question": {"type": "string"},
          "options": {
            "type": "object",
            "properties": {
              "A": {"type": "string"},
              "B": {"type": "string"},
              "C": {"type": "string"},
              "D": {"type": "string"}
            },
            "required": ["A", "B", "C", "D"]
          },
          "answer": {"type": "string", "description": "The correct option key, e.g., 'A' or 'B'"},
          "explanation": {"type": "string", "description": "A brief explanation of the correct answer."}
        },
        "required": ["id", "question", "options", "answer", "explanation"]
      }
    }
  },
  "required": ["quiz"]
}
`;

// Endpoint to generate the quiz
app.post('/api/generate-quiz', async (req, res) => {
    try {
        const numQuestions = req.body.numQuestions || 5;

        // Use the structured output feature for reliable JSON
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: QUIZ_GENERATION_PROMPT(numQuestions),
            config: {
                responseMimeType: "application/json",
                // Pass the schema to ensure the model's output is valid JSON
                responseSchema: JSON.parse(QUIZ_GENERATION_PROMPT().match(/JSON Schema:\s*([\s\S]*)/)[1]) 
            }
        });

        // The response.text will be a valid JSON string
        const quizData = JSON.parse(response.text);

        res.json({ success: true, quiz: quizData.quiz });

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({ success: false, message: "Failed to generate quiz." });
    }
});

// You'll also need an endpoint to submit and check answers, which is an extension.

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});