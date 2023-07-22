import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.js';
import User from '../models/user.js';

const router = express.Router();

router.put('/signup', 
  body('email')
    .isEmail()
    .withMessage('Please enter valid email')
    .custom((value, {req}) => {
      return User.findOne({email: value})
        .then(user => {
          if (user) {
           return Promise.reject('Email Already exist')
          }
          return true;
        })
    })
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({min: 5}),
  body('name')
    .trim()
    .not()
    .isEmpty(),
  authController.postSignup)

router.post('/login', authController.login)

export default router;