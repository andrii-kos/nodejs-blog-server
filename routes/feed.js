import express from 'express';
import * as feedController from '../controllers/feed.js';
import { body } from 'express-validator';


const router = express.Router();


router.get('/posts', feedController.getPosts);

router.get('/post/:postId', feedController.getPost);


router.post('/post', 
  body('content')
    .trim()
    .isLength({min: 5}),
  body('title')
    .trim()
    .isLength({min: 5}),
  feedController.postPost);

router.put('/post/:postId', 
  body('content')
    .trim()
    .isLength({min: 5}),
  body('title')
    .trim()
    .isLength({min: 5}),
feedController.updatePost)

router.delete('/post/:postId', feedController.deletePost)

export default router;