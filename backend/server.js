// server.js (Production Ready for Render)
require('dotenv').config(); 
const express = require('express');
const path = require('path'); // <-- ADDED: Needed for file paths
const { GoogleGenAI } = require('@google/genai');
const app = express();
// CHANGED: Use process.env.PORT for Render, default to 3000 locally
const port = process.env.PORT || 3000; 

// Initialize the GoogleGenAI client (will automatically look for 
// GEMINI_API_KEY in the environment variables set on Render)
const ai = new GoogleGenAI({}); 

// Middleware to parse JSON bodies
app.use(express.json()); 

// --- REMOVED: CORS middleware is NOT needed when serving the frontend from the same server ---
/* app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
*/

// --- ADDED: Static File Serving ---
// Tells Express to serve static files (index.html, CSS, client-side JS) 
// from the 'public' folder. 
app.use(express.static(path.join(__dirname, 'public')));


// The core prompt to generate the e-waste quiz (No changes here)
const QUIZ_GENERATION_PROMPT = (numQuestions = 5) => `
// ... (Your QUIZ_GENERATION_PROMPT remains the same)
`;


// Endpoint to generate the quiz (No functional changes here)
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


// --- ADDED: Catch-all Route for the Frontend ---
// This handles the "Cannot GET /" error by serving index.html for the root URL
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});