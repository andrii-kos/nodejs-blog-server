import User from '../models/user.js';
import { validationResult } from "express-validator";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const postSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation faild')
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, password, name } = req.body;
  bcryptjs.hash(password, 12)
    .then(hash => {
      const user = new User({email, password: hash, name})
      return user.save()
    })
    .then(result => {
      res.status(201).json({message: 'User created', userId: result._id})
    })
    .catch(err => {
      if (!err.statusCode) {
        console.log(err)
        err.statusCode = 500;
      }
      next(err);
    })
}

export const login = (req, res, next) => {
  const {email, password} = req.body;
  let loadedUser;
  User.findOne({email: email})
    .then(user => {
      if (!user) {
        const err = new Error('User is not found')
        err.statusCode = 401;
        throw err
      }
      loadedUser = user;
      return bcryptjs.compare(password, user.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const err = new Error('wrong password')
        err.statusCode = 401;
        throw err;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email, 
          userId: loadedUser._id
        }, 
        'secret', 
        {expiresIn: '1h'});
      
      res.status(200).json({token, userId: loadedUser._id.toString()})

    })

    .catch(err => {
      if (!err.statusCode) {
        console.log(err)
        err.statusCode = 500;
      }
      next(err);
    })
}