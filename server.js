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

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

// Serve React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.use('/css', express.static(__dirname + '/public/css'));

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// In-memory storage for agreement types and fields
let agreementTypes = {
  'Rental Agreement': ['Name', 'Address', 'Rent Amount'],
  'Sale Deed': ['Buyer Name', 'Seller Name', 'Property Address', 'Sale Amount']
};

// API Endpoints
app.get('/api/agreement-types', (req, res) => {
  res.json(agreementTypes);
});

app.post('/api/agreement-types', (req, res) => {
  const { name, fields } = req.body;
  if (name && fields) {
    agreementTypes[name] = fields;
    res.status(201).json({ message: 'Agreement type created successfully.' });
  } else {
    res.status(400).json({ message: 'Invalid request. Please provide name and fields.' });
  }
});

app.post('/api/extract', upload.array('images'), async (req, res) => {
  try {
    const { agreementType } = req.body;
    const fields = agreementTypes[agreementType];
    const images = req.files.map(file => ({
      path: file.path,
      mimeType: file.mimetype
    }));

    if (!fields || !images || images.length === 0) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    const prompt = `Analyze the attached images of a ${agreementType}. Extract the following fields: ${fields.join(', ')}. Your response MUST be a single, valid JSON object. Do not include any text, explanations, or markdown formatting before or after the JSON object. The JSON keys should be the field names provided.`;
    const imageParts = images.map(image => ({
      inlineData: {
        data: Buffer.from(fs.readFileSync(image.path)).toString('base64'),
        mimeType: image.mimeType
      }
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    const extractedData = JSON.parse(text.replace(/```json\n|```/g, ''));

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
  console.log(`Server is running on port ${port}`);
});
