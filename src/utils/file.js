import { rejects } from 'assert';
import fs from 'fs';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { format } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
}

export const uploadImageToStorage  = (file, bucket) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      rejects('No File Provided')
    }
    let newFileName = `${new Date().toISOString()}-${file.originalname.replace(/:/g,"_").replace(/ /g,"_")}`;
    let fileUpload = bucket.file(newFileName);
    
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      reject('Something is wrong! Unable to upload at the moment.');
    })
    blobStream.on('finish', () => {
      const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media`);
      resolve(url);
    });
    blobStream.end(file.buffer);
  })
}


