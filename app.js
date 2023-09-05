import express from 'express';

import bodyParser from 'body-parser';
import feedRoutes from './routes/feed.js';
import authRoutes from './routes/auth.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as graphql from 'express-graphql'
import graphqlSchema from './graphql/schema.js';
import graphqlResolver from './graphql/resolver.js';
import isAuth from './middleware/isAuth.js';
import { clearImage } from './utils/file.js';

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
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next();
})

app.use(isAuth);

app.use('/post-image', (req, res, next) => {
  if (!isAuth) {
    throw new Error('Not Authenticated')
  }
  if (!req.file) {
    return res.status(200).json({message: 'No file provided'})
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  return res.status(201).json({message: "File Stored", filePath: req.file.path.replace(/\\/g,"/")})
})

app.use(
  '/graphql', 
  graphql.graphqlHTTP({
    schema: graphqlSchema,
    graphiql: true,
    rootValue: graphqlResolver,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err
      }
      const data = err.originalError.data;
      const message = err.message || 'Error occured'
      const code = err.originalError.code || 500;
      return {message, status: code, data: data}
    }
  })
)

app.use((err, req, res, next) => {
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
