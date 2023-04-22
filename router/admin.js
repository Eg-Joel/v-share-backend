const router = require("express").Router()
const { body, validationResult } = require('express-validator')
const { adminLogin, getUsers, searchUser, banUser, unBanUser, getPosts, searchPosts, banPost, unBanPost, getReports } = require("../controllers/adminController");
const { verifyToken, isAdmin } = require('../middlewares/verifyToken');


// admin login
router.post("/admin-login",
       body('email').isEmail(), 
       body('password').isLength({ min: 6 }),adminLogin);

// User management
router.get('/users/:pageNumber',verifyToken, isAdmin,getUsers)
router.get('/searchUsers/:value',verifyToken, isAdmin,searchUser)
router.patch('/banUser',verifyToken, isAdmin,banUser)
router.patch('/unBanUser',verifyToken, isAdmin,unBanUser)

// post management
router.get('/posts/:pageNumber',verifyToken, isAdmin,getPosts)
router.get('/searchPosts/:value',verifyToken, isAdmin,searchPosts)
router.patch('/banPost',verifyToken, isAdmin,banPost)
router.patch('/unBanPost',verifyToken, isAdmin,unBanPost)

// report management
router.get('/reports/:pageNumber',verifyToken, isAdmin,getReports)
       
module.exports = router