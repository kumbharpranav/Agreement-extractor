require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// Serve React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// API Endpoints
app.post('/api/extract', upload.array('images'), async (req, res) => {
  try {
    const fields = JSON.parse(req.body.fields);
    const images = req.files.map(file => ({
      path: file.path,
      mimeType: file.mimetype
    }));

    if (!fields || fields.length === 0 || !images || images.length === 0) {
      return res.status(400).json({ message: 'Invalid request. Fields and images are required.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analyze the attached images. Extract the following fields: ${fields.join(', ')}. Your response MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON object. The JSON keys should be the field names provided.`;
    const imageParts = images.map(image => ({
      inlineData: {
        data: Buffer.from(fs.readFileSync(image.path)).toString('base64'),
        mimeType: image.mimeType
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    let extractedData;
    try {
      extractedData = JSON.parse(text.replace(/```json\n|```/g, ''));
    } catch (jsonError) {
      console.error('Failed to parse JSON from Gemini API:', text, jsonError);
      return res.status(500).json({ message: 'Failed to parse data from AI. Please try again.' });
    }

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Extracted Data');
    worksheet.columns = fields.map(field => ({ header: field, key: field }));
    worksheet.addRow(extractedData);

    const excelBuffer = await workbook.xlsx.writeBuffer();
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);

    // Clean up uploaded files
    images.forEach(image => fs.unlinkSync(image.path));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during data extraction.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running and listening on port ${port}`);
});
