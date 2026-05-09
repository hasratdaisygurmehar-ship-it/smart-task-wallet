import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as chrono from 'chrono-node';
import Tesseract from 'tesseract.js';
import multer from 'multer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running on Vercel!' });
});

app.post('/api/parse-task', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const parsedResults = chrono.parse(text);
    if (parsedResults.length === 0) {
      return res.json({ originalText: text, taskTitle: text, scheduledDate: null, scheduledTime: null });
    }
    const result = parsedResults[0];
    const parsedDate = result.start.date();
    const taskTitle = text.replace(result.text, '').trim() || text;
    res.json({
      originalText: text,
      taskTitle: taskTitle,
      scheduledDate: parsedDate.toISOString().split('T')[0],
      scheduledTime: parsedDate.toISOString().split('T')[1]?.substring(0, 5),
      priority: text.toLowerCase().includes('urgent') ? 'High' : 'Medium'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse task' });
  }
});

app.post('/api/scan-bill', upload.single('billImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const imageBuffer = req.file.buffer;
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    const amountRegex = /[$]?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g;
    const amounts = text.match(amountRegex) || [];
    let maxAmount = 0;
    amounts.forEach(amt => {
      const num = parseFloat(amt.replace(/[$|,]/g, ''));
      if (num > maxAmount) maxAmount = num;
    });
    const dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g;
    const dates = text.match(dateRegex) || [];
    res.json({
      rawText: text,
      detectedAmount: maxAmount > 0 ? `$${maxAmount.toFixed(2)}` : null,
      detectedDates: dates,
      vendor: 'Scanned Bill'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan bill' });
  }
});

export default app;
