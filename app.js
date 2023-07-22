import express from 'express';
import bodyParser from 'body-parser';
import feedRoutes from './routes/feed.js';
import authRoutes from './routes/auth.js'
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage(({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, (new Date().toISOString() +  '-' + file.originalname).replace(/:/g,"_").replace(/ /g,"_"))
  }
}));

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpg' || 
    file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());

app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'))

app.use('/images', express.static(path.join((__dirname, 'images'))));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
})

app.use('/feed', feedRoutes)

app.use('/auth', authRoutes)

app.use((err, req, res, next) => {
  console.log(err);
  const status = err.statusCode;
  const message = err.message;
  const errorData = err.data;
  res.status(status).json({message, data: errorData})
})

mongoose.connect('mongodb+srv://ndrwkos:WF6Z5Pcqkdi76gIm@cluster0.tyygxzk.mongodb.net/messanger?retryWrites=true&w=majority')
  .then(() => {
    app.listen(3001)
    console.log('Contected to mongo db')
  })
  .catch(err => console.log(err))
