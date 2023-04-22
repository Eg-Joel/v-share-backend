const router = require("express").Router()
const { createPost, getPost, updatePost, postLike, postDisLike, comments, deletePost, followingUser, followersr, followers, reportPost, allReports, rejectReport, resolveReport, followingUsers, commentDelete, LikedUsers } = require('../controllers/PostController')
const { verifyToken,isAdmin } = require("../middlewares/verifyToken")

//create post
router.post("/user/post",verifyToken,createPost)

//get post
router.get("/get/post/:id",getPost)

//update post
router.put("/update/post/:id",verifyToken,updatePost)

//like 
router.put("/:id/like",verifyToken,postLike)

//dislike
router.put("/:id/dislike",verifyToken,postDisLike)

//liked users
router.get("/likedUsers/:id",verifyToken, LikedUsers)
//comment
router.put("/comment/post",verifyToken, comments)

//delete comment
router.put("/:id/deleteComment",verifyToken,commentDelete)
//delete post
router.delete("/deletepost/:id",verifyToken , deletePost)

//get a following user
router.get("/following/:id",verifyToken, followingUser)

//get fillowing users
router.get("/followingUser/:id",verifyToken,followingUsers)

//get a followers
router.get("/followers/:id",verifyToken, followers)

//report post
router.put("/:id/report",verifyToken, reportPost);

//report post
router.get("/reports/:id",verifyToken,isAdmin, allReports);

//reject report
router.delete("/:id/report",verifyToken,isAdmin, rejectReport);

//resolve report
router.delete("/:id/rejectReport",verifyToken,isAdmin, resolveReport); 

module.exports = router