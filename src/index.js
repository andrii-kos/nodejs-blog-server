import express from 'express';
import functions from 'firebase-functions';
import bodyParser from 'body-parser';
import feedRoutes from './routes/feed.js';
import authRoutes from './routes/auth.js';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer, { memoryStorage } from 'multer';
import * as graphql from 'express-graphql'
import graphqlSchema from './graphql/schema.js';
import graphqlResolver from './graphql/resolver.js';
import isAuth from './middleware/isAuth.js';
import { clearImage, uploadImageToStorage } from './utils/file.js';
import cors from 'cors'
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: "json" };
import {getStorage }from 'firebase-admin/storage'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://nodejs-blog-server"
})

const bucket = getStorage().bucket("gs://nodejs-blog-server")


const app = express();

const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());


// const storage = multer.diskStorage(({
//   destination: (req, file, cb) => {
//     cb(null, 'images')
//   },
//   filename: (req, file, cb) => {
//     cb(null, (new Date().toISOString() +  '-' + file.originalname).replace(/:/g,"_").replace(/ /g,"_"))
//   }
// }));


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
app.use(multer({fileFileter: fileFilter, storage: memoryStorage()}).single('image'))

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200)
//   }
//   next();
// })

app.use(isAuth);

app.use('/post-image', (req, res, next) => {
  let file = req.file;
  if (!isAuth) {
    return res.status(200).json({message: 'Not Authenticated'})
  }
  if (!file) {
    return res.status(200).json({message: 'No file provided'})
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  uploadImageToStorage(file, bucket)
    .then((url) => {
      return res.status(201).json({message: "File Stored", filePath: url})
    })
  
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


let client  
if (client && client.isConnected()) {
  console.log('DB CLIENT ALREADY CONNECTED')

} else try {
  client = await mongoose.connect('mongodb+srv://ndrwkos:WF6Z5Pcqkdi76gIm@cluster0.tyygxzk.mongodb.net/messanger?retryWrites=true&w=majority')
  .then(() => {
    app.listen(PORT)
    console.log('Contected to mongo db')
  })
  console.log('DB CLIENT RECONNECTED')
} catch (e) {
  throw e
  }


  export const api = functions.https.onRequest(app);

