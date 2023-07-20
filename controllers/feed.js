import { validationResult } from "express-validator";
import Post from "../models/post.js";

import path, { toNamespacedPath } from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let total
  Post.find()
    .countDocuments()
    .then(count => {
      total = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
    })
    .then(posts => {
      if (!posts) {
        const err = new Error('Could not find any posts')
        err.statusCode = 404;
        throw err;
      }
      res.status(200).json({posts: posts, totalItems: total})
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
    
}

export const getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const err = new Error('Could not find post')
        err.statusCode = 404;
        throw err;
      }
      res.status(200).json({message: 'Post fetched', post})
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}


export const postPost = (req, res, next) => {
  if (!req.file) {
    const err = new Error('file missing');
    err.statusCode = 422;
    throw err;
  }
  const imageUrl = req.file.path.replace("\\" ,"/");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation Failed')
    err.statusCode = 422;
    throw err
  }
  const post = new Post({...req.body, imageUrl: imageUrl, creator: {name: 'Andrii'}})
  post
    .save()
    .then((result) => {
      res.status(201).json({
        message: 'Post created succssessfully',
        post: result
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
  
}

export const updatePost = (req, res, next) => {
  const { postId } = req.params;
  const { title, content } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error('Validation Failed')
    err.statusCode = 422;
    throw err
  }

 
  let imageUrl = req.body.image
  if (req.file) {
    imageUrl = req.file.path.replace("\\" ,"/");
  } 
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error
  };

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const err = new Error('Could not find post')
        err.statusCode = 404;
        throw err;
      };
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl)
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      post
        .save()
        .then(result => {
          res.status(200).json({message: 'Updated Successfull', post: result})
        })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

export const deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const err = new Error('Could not find post')
        err.statusCode = 404;
        throw err;
      };
      clearImage(post.imageUrl)
      return Post.findByIdAndRemove(postId)
    })
    .then(result => {
      console.log(result)
      res.status(200).json({message: 'Deleted Successfull'})
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err))

}
