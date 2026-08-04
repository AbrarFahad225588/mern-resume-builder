import  express from 'express';
import  cookieParser from 'cookie-parser';
import  bodyParser from 'body-parser';
import cors from 'cors';
import path from 'node:path';
import dotenv from 'dotenv/config';
import templatesRoutes from './routes/templatesRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import {connectDb }from  './db/connectDb.js';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static assets: public/templates/<id>.png is served at /templates/<id>.png,
// matching the `previewImage` paths stored on each template.
app.use(express.static(path.join(import.meta.dirname, 'public')));

app.use('/api/templates', templatesRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/auth', userRoutes);


const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// The database connection must be established *before* the server starts
// accepting traffic. Listening first leaves a window where routes run while
// Mongoose is still connecting, so every query sits in the buffer until it
// times out and the route answers 500 (e.g. "Failed to fetch templates").
const startServer = async () => {
  await connectDb();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
