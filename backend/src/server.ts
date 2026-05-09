import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import * as chrono from 'chrono-node';
import Tesseract from 'tesseract.js';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Set up multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

/**
 * Smart Task Parser Endpoint
 * Example input: "Pay electricity bill at 7 PM on 25th"
 */
app.post('/api/parse-task', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Parse the text to find date/time using chrono-node
    const parsedResults = chrono.parse(text);
    
    if (parsedResults.length === 0) {
      return res.json({
        originalText: text,
        taskTitle: text,
        scheduledDate: null,
        scheduledTime: null,
      });
    }

    const result = parsedResults[0];
    if (!result || !result.start) {
      return res.json({
        originalText: text,
        taskTitle: text,
        scheduledDate: null,
        scheduledTime: null,
      });
    }
    const parsedDate = result.start.date();
    const taskTitle = text.replace(result.text, '').trim() || text;
    
    if (!parsedDate) {
      return res.json({
        originalText: text,
        taskTitle: taskTitle,
        scheduledDate: null,
        scheduledTime: null,
      });
    }

    res.json({
      originalText: text,
      taskTitle: taskTitle,
      scheduledDate: parsedDate.toISOString().split('T')[0] ?? null,
      scheduledTime: parsedDate.toISOString().split('T')[1]?.substring(0, 5) ?? null,
      priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('important') ? 'High' : 'Medium',
      rawDateObj: parsedDate ?? null
    });
  } catch (error) {
    console.error('Error parsing task:', error);
    res.status(500).json({ error: 'Failed to parse task' });
  }
});

/**
 * OCR Bill Scanner Endpoint
 * Accepts an image file and uses Tesseract.js to extract text and amounts
 */
app.post('/api/scan-bill', upload.single('billImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Convert buffer to base64 for Tesseract
    const imageBuffer = req.file.buffer;
    
    // Run OCR
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      { logger: m => console.log(m) }
    );

    // Naive regex to extract amount (e.g., $45.00, 45.00)
    const amountRegex = /[$]?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g;
    const amounts = text.match(amountRegex) || [];
    
    // Find the max amount, assuming it's the total
    let maxAmount = 0;
    amounts.forEach(amt => {
      const num = parseFloat(amt.replace(/[$|,]/g, ''));
      if (num > maxAmount) maxAmount = num;
    });

    // Naive regex to extract dates (e.g., 10/25/2026, 2026-10-25)
    const dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g;
    const dates = text.match(dateRegex) || [];

    res.json({
      rawText: text,
      detectedAmount: maxAmount > 0 ? `$${maxAmount.toFixed(2)}` : null,
      detectedDates: dates,
      vendor: 'Unknown Vendor (Parse from text)'
    });
  } catch (error) {
    console.error('Error scanning bill:', error);
    res.status(500).json({ error: 'Failed to scan bill' });
  }
});

// All remaining requests return the React app, so it can handle routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
