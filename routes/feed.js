import express from 'express';
import * as feedController from '../controllers/feed.js';
import { body } from 'express-validator';
import isAuth from '../middleware/isAuth.js';

const router = express.Router();

router.get('/status', isAuth, feedController.getStatus);

router.put('/status', 
  isAuth, 
  feedController.updateStatus);


router.get('/posts', isAuth, feedController.getPosts);

router.get('/post/:postId', feedController.getPost);


router.post('/post', 
  isAuth,
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
feedController.updatePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

export default router;