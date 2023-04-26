const Post = require("../models/Post");
const User = require("../models/User");
const Report = require("../models/report")
const Notification= require("../models/notification")

 
//create post
exports.createPost = async (req,res) => {
    try {
        
        let {title, image, video} = req.body;
        
        if (!title.trim()) {
          return res.status(400).json({ error: 'Please enter a title for your post' });
        }
        if ((image && !image.startsWith('https://')) || (video && !video.startsWith('https://'))) {
          return res.status(400).json({ error: 'Only image and video URLs are allowed' });
        }
        let newpost = new Post({
          title, image, video, user:req.user.id
        })
        const post = await newpost.save()
        res.status(200).json(post)
    } catch (error) {
        return res.status(500).json("internal error occured")
    }

}

//get post 
exports.getPost =async (req,res)=>{
    try {
        const mypost = await Post.find({user:req.params.id})
        if(!mypost){
            return res.status(200).json("you don't have any post")
        }
        res.status(200).json(mypost)
    } catch (error) {
        return res.status(500).json("internal server error occured")
    }
}

exports.updatePost=async (req,res)=>{
    try {
        

        let post = await Post.findById(req.params.id)
        if(!post){
            return res.status(400).json("post dose not found")
        }
        // post = await Post.findByIdAndUpdate(req.params.id,{
        //     $set:req.body
        // })
        post.set(req.body)
        const updatedPost = await post.save()
        res.status(200).json(updatedPost)
        // res.status(200).json(post)
        // let updatepost = await post.save()
        // res.status(200).json(updatepost)
    } catch (error) {
        res.status(500).json("internal error occured ")
    }
}

exports.postLike = async(req,res)=>{
    try {
        
      
    const post = await Post.findById(req.params.id)

    if(!post.like.includes(req.user.id)){
        if(post.dislike.includes(req.user.id)){
            
            await post.updateOne({$pull:{dislike:req.user.id}})
           
      }
      await post.updateOne({$push:{like:req.user.id}})
      let loggedInUserId=req.user.id
      
      if(post.user.toString() !== loggedInUserId){
        Notification.create({
          type: "like",
          user: post.user,
          friend: loggedInUserId,
          postId: post._id,
          content: 'Liked your post'
      })
      
      }
      
      return res.status(200).json("Post has been liked")
      
    }else{
        await post.updateOne({$pull:{like:req.user.id}})
        if(post.user.toString() !== loggedInUserId){
         Notification.deleteOne({
          type: "like",
          user: post.user,
          friend: loggedInUserId,
          postId: post._id,
          content: 'Liked your post'
      })
      // await Notification.deleteOne();
    }
        return res.status(200).json("Post has been unlike")
    }
} catch (error) {
        res.status(500).json("internal error occured")
}
}

exports.postDisLike = async(req,res)=>{
    try {
       
    
    const post = await Post.findById(req.params.id)
    if(!post.dislike.includes(req.user.id)){
        if(post.like.includes(req.user.id)){
            await post.updateOne({$pull:{like:req.user.id}})
           
      }
      await post.updateOne({$push:{dislike:req.user.id}})
      let loggedInUserId=req.user.id
      if(post.user.toString() !== loggedInUserId){
        Notification.deleteOne({
         type: "like",
         user: post.user,
         friend: loggedInUserId,
         postId: post._id,
         content: 'Liked your post'
     })
     await Notification.deleteOne();
   }
      return res.status(200).json("Post has been disliked")
    }else{
        await post.updateOne({$pull:{dislike:req.user.id}})
        return res.status(200).json("Post has been unlike")
    }
} catch (error) {
    res.status(500).json("internal error occured")     
}
}
exports.comments = async(req,res)=>{
  
    try {
      
        const {comment,postid,profile} = req.body
        const comments ={
            user:req.user.id,
            username:req.user.username,
            profile,
            comment
        }
        const post = await Post.findById(postid)
        post.comments.push(comments)
        const loggedInUserId=req.user.id
        if(post.user.toString()  !== loggedInUserId){
        const notification = new Notification({
          type: "Comment",
          user: post.user,
          friend: loggedInUserId,
          postId: post._id,
          content: 'commented on your post'
      })
      await notification.save();
    }
        await post.save()
        res.status(200).json(post)
        
    } catch (error) {
        res.status(500).json("internal error occured")  
    }
}

exports.commentDelete = async(req,res)=>{
  try {
    
    const post = await Post.findById(req.params.id)
    const commentId =req.body._id
   
    await post.updateOne({$pull:{comments:{_id:commentId}}})
    const upost = await post.save()
    res.status(200).json(upost);
  } catch (error) {
    res.status(500).json("err");
  }
}

exports.deletePost = async(req,res)=>{
    try { 
  
        const post = await Post.findById(req.params.id)
       
        if(post.user == req.user.id){
          post.isDeleted = true;
          await post.save();
            return res.status(200).json("your post has been deleted")
        }else{
            return res.status(400).json("your are not allow to delete this post")
        }
    } catch (error) {
        res.status(500).json("internal error occured")   
    }
}
exports.followingUser = async(req,res)=>{
     try {
        const user = await User.findById(req.params.id)
     
        const followinguser = await Promise.all(
            user.following.map((item)=>{
                return User.findById(item)
            })
        )
        let followingList =[]
        followinguser.map((person)=>{
            const {email, password , phonenumber , following, followers , ...others}=person._doc
            followingList.push(others)
        })
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = followingList.length;
        const results = followingList.slice(startIndex, endIndex);

        res.status(200).json({
            results: results,
            page: page,
            totalPages: Math.ceil(total / limit)
        });
        // res.status(200).json(followingList)
     } catch (error) {
         return res.status(500).json("internal server error occured")
     }
    }

    
exports.followingUserss = async(req,res)=>{
  try {
     const user = await User.findById(req.params.id)
  
     const followinguser = await Promise.all(
         user.following.map((item)=>{
             return User.findById(item)
         })
     )
     let followingList =[]
     followinguser.map((person)=>{
         const {email, password , phonenumber , following, followers , ...others}=person._doc
         followingList.push(others)
     })
     

     res.status(200).json({  followingList   });
     // res.status(200).json(followingList)
  } catch (error) {
      return res.status(500).json("internal server error occured")
  }
 }
    exports.followingUsers = async(req,res)=>{
      try {
       
         const user = await User.findById(req.params.id)
      
         const followinguser = await Promise.all(
             user.following.map((item)=>{
                 return User.findById(item)
             })
         )
         let followingList =[]
         followinguser.map((person)=>{
             const {email, password , phonenumber , following, followers , ...others}=person._doc
             followingList.push(others)
         })
     
         res.status(200).json(followingList)
      } catch (error) {
          return res.status(500).json("internal server error occured")
      }
     }
exports.followers = async(req,res)=>{
    try {
      
       const user = await User.findById(req.params.id)
  
       const followersuser = await Promise.all(
           user.followers.map((item)=>{
               return User.findById(item)
           })
       )
       let followersList =[]
       followersuser.map((person)=>{
           const {email, password , phonenumber , following, followers , ...others}=person._doc
           followersList.push(others)
       })
       res.status(200).json(followersList)
    } catch (error) {
        return res.status(500).json("internal server error occured")
    }
}
exports.LikedUsers = async (req,res)=>{
  
  try {
    const post = await Post.findById(req.params.id)

    const likedUsers = await Promise.all(
          post.like.map((item)=>{
            return User.findById(item)
          })
      )
    let likedList = []
    
    likedUsers.map((person)=>{
        const {email, password , phonenumber , following, followers ,...other}=person._doc
        likedList.push(other)
      })
   res.status(200).json(likedList)
  } catch (error) {
    return res.status(500).json("internal server error occured")
  }
}
exports.reportPost=async (req, res) => {
    try {
     
      const post = await Post.findById(req.params.id);
    
      req.body.userId = req.user.id
      req.body.name = req.user?.username

      req.body.postId = post._id
      req.body.post=post?.image
      req.body.desc=post.desc
      req.body.type="post"
      if (post.reports.filter(e => e === req.user.id).length <= 0) {
        /* vendors contains the element we're looking for */
        await post.updateOne({ $push: { reports: req.user.id } });
        const newReport = new Report(req.body);
        const savedReport = await newReport.save();

        res.status(200).json(savedReport);
      } else {
        res.status(403).json("you already reported this post");
      }
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
 
}

exports.allReports=async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: 'desc' });
    res.status(200).json(reports);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
}

exports.rejectReport=async (req, res) => {
  try {
    
    var isPostFound=true
    const post = await Post.findById(req.params.id);
    console.log(post);
    // const report = await Report.findById(req.query.id)
    if (!post) {
      res.status(403).json("post not found");
      isPostFound = false
    }
    if (post.user === req.user.id || req.user.isAdmin) {
      await post.updateOne({ $pull: { reports: req.query.name} }).then((res)=>{
        console.log(res);
      });
      await Report.deleteMany({_id:req.query.id})
      res.status(200).json("report removed");
    } else {
      res.status(403).json("authorization failed");
    }
  } catch (err) {
    if (isPostFound) {
      res.status(500).json(err);
    }
    console.log(err);
  }
}

exports.resolveReport=async (req, res) => {
  try {
    var isPostFound=true
    const post = await Post.findById(req.params.id);
    // const report = await Report.findById(req.query.id)
    if (!post) {
      res.status(403).json("post not found");
      isPostFound = false
    }
    if (post.user === req.user.id || req.user.isAdmin) {
      post.isDeleted = true;
      await post.save();
      await Report.deleteMany({_id:req.query.id})
      res.status(200).json("post deleted");
    } else {
      res.status(403).json("authorization failed");
    }
  } catch (err) {
    if (isPostFound) {
      res.status(500).json(err);
    }
    console.log(err);
  }
}