import User from "../models/user.js";
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from "jsonwebtoken";
import Post from "../models/post.js";
import post from "../models/post.js";
import { clearImage } from "../utils/file.js";

export default {
  createUser: async function({ userInput }, req) {
    const {email, name, password} = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push('Incorect Email Address format')
    }
    if (!validator.isLength(name, {min: 4})) {
      errors.push('Name must contain more then 3 characters')
    }
    if (!validator.isLength(name, {min: 5})) {
      errors.push('Password must contain more then 4 characters')
    }
    if (errors.length) {
      const err = new Error ('Validation faild')
      err.data = errors;
      err.code = 422;
      throw err
    }
    const existingUser = await User.findOne({email: email});
    if (existingUser) {
      const err = new Error('User already exist');
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      name,
      password: hashedPassword
    })
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString()}
  },

  login: async function({email, password}) {
    const user = await User.findOne({email: email});
    if (!user) {
      const error = new Error('User not fout');
      error.code = 401;
      throw error
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('Incorect Password');
      error.code = 401;
      throw error;
    };
    
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email,
    }, 'secret', {
      expiresIn: '1h'
    })
    return {token, userId: user._id.toString()}
  },

  createPost: async ({postInput}, req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (!validator.isLength(title, {min: 5, max: 50})) {
      errors.push('Title must be more then 5 and less then 50 characters')
    }
    if (!validator.isAlphanumeric(title)) {
      errors.push('Title must contain only leters and numbers')
    }
    if (!validator.isLength(content, {min: 5, max: 50})) {
      errors.push('Content must contain more then 4 characters')
    }
    if (!validator.isAlphanumeric(content)) {
      errors.push('Content must contain only leters and numbers')
    }
    // if (!validator.isURL(imageUrl)) {
    //   errors.push('Image Url must me an url')
    // }
    if (errors.length) {
      const err = new Error ('Validation faild')
      err.data = errors;
      err.code = 422;
      throw err
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error ('Authenticated use not found')
      err.data = errors;
      err.code = 401;
      throw err
    }
    const post =  new Post({title, content, imageUrl, creator: user});
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc, 
      _id: createdPost._id.toString(), 
      createdAt: createdPost.createdAt.toISOString(),
      updtatedAt: createdPost.updatedAt.toISOString()
    }
  },

  posts: async ({page}, req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err;
    };
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments()
    const posts = await Post
      .find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({createdAt: -1})
      .populate('creator')
    return {
      posts: posts.map(elem => ({
        ...elem._doc, 
        _id: elem._id.toString(),
        createdAt: elem.createdAt.toISOString(),
        updatedAt: elem.updatedAt.toISOString(),
      })), 
      totalPosts
    }
  },
  post: async ({id}, req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err
    }
    const post = await Post.findById(id).populate('creator');
    return {
      ...post._doc, 
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },
  updatePost: async ({postId, postInput}, req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err
    }
    const {title, content, imageUrl} = postInput;
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const err = new Error('post not found')
      err.code = 404;
      throw err
    }
    post.title = title;
    post.content = content;
    const errors = [];
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }

    if (!validator.isLength(title, {min: 5, max: 50})) {
      errors.push('Title must be more then 5 and less then 50 characters')
    }
    if (!validator.isAlphanumeric(title)) {
      errors.push('Title must contain only leters and numbers')
    }
    if (!validator.isLength(content, {min: 5, max: 50})) {
      errors.push('Content must contain more then 4 characters')
    }
    if (!validator.isAlphanumeric(content)) {
      errors.push('Content must contain only leters and numbers')
    }
    if (errors.length > 0) {
      const err = new Error ('Validation faild')
      err.data = errors;
      err.code = 422;
      throw err
    }
    const savedPost = await post.save()
    return {
      ...savedPost._doc, 
      _id: savedPost._id.toString(),
      createdAt: savedPost.createdAt.toISOString(),
      updatedAt: savedPost.updatedAt.toISOString()
    }
  },
  deletePost: async ({postId}, req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err
    }
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post not found');
      error.code = 404;
      throw error
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error
    }
    clearImage(post.imageUrl)
    const user = await User.findById(req.userId);
    user.posts.pull+(postId);
    await user.save();
    await Post.findByIdAndRemove(postId)
    return {
      ...post._doc, 
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },
  
  user: async ({},req) => {
    if (!req.isAuth) {
      const err = new Error ('Not Authenticated')
      err.code = 401;
      throw err
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 404;
      throw error
    }
    return {
      ...user._doc,
      _id: user._id.toString(),
    }
  },
  updateUserStatus: async ({status}, req) => {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.code = 404;
      throw error
    };
    user.status = status;
    const savedUser = await user.save();
    return {
      ...savedUser._doc,
      _id: savedUser._id.toString(),
    }
  }
}