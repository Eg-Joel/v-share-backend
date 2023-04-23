const { validationResult } = require("express-validator")
const { validate } = require("../models/User")
const User = require("../models/User")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Notification=require('../models/notification')
const jwtSEC = "#2idfbfb$%TTtrr123##"
const Post = require("../models/Post");
const VerificationToken=require("../models/verificationToken")
const ResetToken = require("../models/ResetToken")
const { generateOTP } = require("../router/otp/mail");
const nodemailer = require('nodemailer')
const crypto = require("crypto");




exports.createUser =async (req,res)=>{
    const error = validationResult(req)
    // if(!error.isEmpty()){
    //     return res.status(400).json('some error occured')
    // }
    // try {
     
    let user = await User.findOne({email:req.body.email});
    if(user){
        return res.status(200).json({msg:"Please login with correct password"})
    };
    let password = req.body.password
   
    const salt = await bcrypt.genSalt(10);
    const hashPas = await bcrypt.hash(password, salt)
    
    user = await User.create({
        username:req.body.username,
        email:req.body.email,
        password:hashPas,
        profile:req.body.profile,
        phonenumber:req.body.phonenumber
    })
    const accessToken = jwt.sign({
        id:user._id,
        username:user.username,
       
    },jwtSEC)

    const OTP = generateOTP()
    const verificationToken =await VerificationToken.create({
        user:user._id,
        token:OTP
    })
    verificationToken.save()
    await user.save();

      var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.USER,
          pass: process.env.PASS
        }
      });
      transport.sendMail({
        from:"V-Share@gmail.com",
        to:user.email,
        subject:"Verify your email using OTP",
        html:`<h1>Your OTP code  ${OTP}</h1>`
      })
    
    res.status(200).json({Status:"pending",msg:"Please check your email",user:user._id})

// } catch (error) {
//         return res.status(400).json('internal error occured')
// }
}

exports.verifyEmail = async (req,res)=>{
    const {user, OTP} = req.body
    const mainUser = await User.findById(user)
    if(!mainUser)return res.status(400).json({msg:"User not found"})
    if(mainUser.verfied === true){
        return res.status(400).json({msg:"user already verfied"})
        
    }
    const token = await VerificationToken.findOne({user:mainUser._id})
    if(!token){
        return res.status(400).json({msg:"sorry token not found"})
    }
    const isMatch =await bcrypt.compareSync(OTP, token.token)
    if(!isMatch){return res.status(400).json("Token is not vaild")}
    mainUser.verfied = true
    await VerificationToken.findByIdAndDelete(token._id)
    await mainUser.save()
    const accessToken = jwt.sign({
        id:mainUser._id,
        username:mainUser.username
        
        
    } , jwtSEC)
    const {password ,...other}= mainUser._doc
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.USER,
            pass: process.env.PASS
        }
      });
      transport.sendMail({
        from:"V-Share@gmail.com",
        to:mainUser.email,
        subject:"Successfuly Verified your email ",
        html:`Now you can login `
      })
      return res.status(200).json({other,accessToken})
}

exports.login = async(req,res)=>{

    const error = validationResult(req)
    // if(!error.isEmpty()){
    //     return res.status(400).json('some error occured')
    // }
    try {
        
    
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return res.status(400).json({msg:"user not found"})
    }
    if (user.isBanned){
        return res.status(400).json({ msg: "you are banned to login"});
      }
    const ComparePassword = await bcrypt.compare(req.body.password,user.password)
    if(!ComparePassword){
        return res.status(400).json({msg:"Password error"})
    }
    
    const accessToken = jwt.sign({
        id:user._id,
        username:user.username
    },jwtSEC)
    const {password , ...other} = user._doc
    res.status(200).json({other,accessToken})
} catch (error) {
        res.status(500).json('internal error occured')
}
}

exports.forgotPassword = async(req,res)=>{
 
    const {email} = req.body;
    const user = await User.findOne({email:email});
    if(!user){
        return res.status(400).json("User not found");
    }
  
    const token = await ResetToken.findOne({user:user._id});
    if(token){
        return res.status(400).json("After one hour you can request for another token");
    }

    const RandomTxt = crypto.randomBytes(20).toString('hex');
    const resetToken = new ResetToken({
        user:user._id,
        token:RandomTxt
    });
    
    await resetToken.save();
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.USER,
            pass: process.env.PASS
        }
      });
      transport.sendMail({
        from:"V-Share@gmail.com",
        to:user.email,
        subject:"reset token ",
        html:`http://localhost:3000/reset/password?token=${RandomTxt}&_id=${user._id}`
      })

      return res.status(200).json("Check your email to reset password")
}

exports.resetPassword = async(req,res)=>{

    const {token , _id} = req.query;
    if(!token || !_id){
        return res.status(400).json("Invalid req");
    }
    const user = await User.findOne({_id:_id});
    if(!user){
        return res.status(400).json("user not found")
    }
    const resetToken = await ResetToken.findOne({user:user._id});
    if(!resetToken){
        return res.status(400).json("Reset token is not found")
    }
    
    const isMatch = await bcrypt.compareSync(token , resetToken.token);
    if(!isMatch){
        return res.status(400).json("Token is not valid");
    }

    const {password} = req.body;
    // const salt = await bcrypt.getSalt(10);
    const secpass = await bcrypt.hash(password , 10);
    user.password = secpass;
    await user.save();
    const transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.USER,
          pass: process.env.PASS
        }
      });
      transport.sendMail({
        from:"sociaMedia@gmail.com",
        to:user.email,
        subject:"Your password reset successfully",
        html:`Now you can login with new password`
      })

      return res.status(200).json("Email has been send")

}

exports.following = async(req,res)=>{
    try {
        
        const id = req.user.id
        
        const friendId = req.body.friendId
   
        const friend = await  User.findById(friendId)
        if (!friend) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        
        if (!friend.followers.includes(id)) { // Check if userId is not already in followers
            friend.followers.push(id);
            await friend.save();
            await Notification.create({
                type: "follow",
                user: friendId,
                friend: id,
                content: 'Started Following You'
            })
            
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (!user.following.includes(friendId)) { // Check if userIdToFollow is not already in following
            user.following.push(friendId);
            await user.save();
        }
        const updatedUser = await User.findById(id);
        // const sugesstions = await User.find({ _id: { $nin: [...updatedUser.followings, id] } });
        res.status(200).json({updatedUser });
    } catch (error) {
        res.status(500).json(error)
    }
}

exports.unFollowUser = async (req, res) => {
    try {
        const id  = req.user.id;
        const friendId = req.body.friendId;
   
        const friend = await User.findById(friendId);
        if (!friend) {
           
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (friend.followers.includes(id)) { // Check if userId is already in followers
           
            const index = friend.followers.indexOf(id);
            
            friend.followers.splice(index, 1); // Remove it from the array
            await friend.save();
            await Notification.deleteOne({
                type: "follow",
                user: friendId,
                friend: id,
                content: 'Started Following You'
            })
        
        }
        
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ msg: "User does not exist" })
        }
        if (user.following.includes(friendId)) { // Check if userIdToUnFollow is already in following
            const index = user.following.indexOf(friendId);
            user.following.splice(index, 1); // Remove it from the array
            await user.save();
          
        }
        const updatedUser = await User.findById(id);
        // const sugesstions = await User.find({ _id: { $nin: [...updatedUser.followings, id] } });
        res.status(200).json({ updatedUser});
    } catch (error) {
        res.status(500).json(error)
    }
}

// exports.following = async(req,res)=>{
//     if(req.params.id !== req.user.id){
       
//         try {
//         const user = await User.findById(req.params.id)
//         const otheruser = await User.findById(req.user.id)
       

//         if(!user.followers.includes(req.user.id)){
//             await user.updateOne({$push:{followers:req.user.id}})
//             await otheruser.updateOne({$push:{following:req.params.id}})
//             await Notification.create({
//                 type: "follow",
//                 user: req.user.id,
//                 friend: req.params.id,
//                 content: 'Started Following You'
//             })
//           let updateUser = await otheruser.save()
       
//             return res.status(200).json(updateUser)

//         }else{
//             await user.updateOne({$pull:{followers:req.user.id}})
//             await otheruser.updateOne({$pull:{following:req.params.id}})
//             let updateUser =await otheruser.save()
           
//             return res.status(200).json(updateUser)
//         }
//     }catch (err) {
//         console.log(err);
//         return res.status(500).json({ error: "Server error" });
//       }
//     }
//     else{
//         return res.status(400).json("you can't follow yourself")
//     }
// }
exports.followerPost = async(req,res)=>{
    try {
        
        const user = await User.findById(req.params.id)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const followerspost= await Promise.all(
            user.following.map((item)=>{
              
                return Post.find({user:item,isDeleted : false})
            })
        )
        
        
        const userPost = await Post.find({user:user._id,isDeleted : false})
        
        const allPosts = userPost.concat(...followerspost)
        allPosts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) 
        
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const results = allPosts.slice(startIndex, endIndex);
        const count = await Post.countDocuments({ user: user._id, isDeleted: false });
        const totalPages = Math.ceil((count + followerspost.length) / limit);
        
        res.status(200).json({ posts: results, totalPages: totalPages })
    } catch (error) {
        return res.status(500).json("internal server error occured")
    }
}
exports.updateProfile = async(req,res)=>{
    try {
        if(req.params.id !== req.user.id){
        if(req.body.password){
            const salt = await bcrypt.genSalt(10)
            const secpass = await bcrypt.hash(req.body.password,salt)
            req.body.password= secpass
            const updateUser = await User.findByIdAndUpdate(req.params.id,{
                $set:req.body
            })
            await updateUser.save()
            res.status(200).json(updateUser)
        }
    }else{
        return res.status(400).json("you are not allow to update this user")
    }
    } catch (error) {
        return res.status(500).json("internal server error occured")
    }
}

exports.deleteUser = async(req,res)=>{
    try {
        if(req.params.id !== req.user.id){
            return res.status(400).json("user account doesn't match")
        }else{
            await User.findByIdAndDelete(req.params.id)
            return res.status(200).json("user account deleted")
        }
    } catch (error) {
        
        return res.status(500).json("internal server error occured")
    }
}

exports.userDetailPost =async(req,res)=>{

    try {
        const user = await User.findById(req.params.id)
        
        if(!user){
            return res.status(400).json("user not found")
        }
        const {email, password, phonenumber, ...others} = user._doc
        res.status(200).json(others)
    } catch (error) {
        return res.status(500).json("internal server error occured")
    
    }
}

exports.GetUsers = async(req,res)=>{
    try {
        const userId = req.params.id

        const user = await User.findById(userId)
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}

exports.userToFollow = async(req,res)=>{
    try {
        const allUser = await User.find();
        const user = await User.findById(req.params.id)
     
        const followingUser = await Promise.all(
            user.following.map((item)=>{
                return item
            }) 
        )
        let usersToFollow = allUser.filter((val)=>{
            return !followingUser.find((item)=>{
                return val._id.toString()===item
            })
        })
        let filterUser = await Promise.all(
            usersToFollow.map((item)=>{
                const {email , phonenumber , followers , following , password ,...others } = item._doc
                return others
            })
        )
        res.status(200).json(filterUser)
    } catch (error) {
        
    }
}

exports.getAllUsers = async(req,res)=>{
    try {
    
        const user = await User.find({},{password:0})
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}
exports.getUsered =async(req,res)=>{
    const userId = req.query.userId
    const username = req.query.username
    try {
        const user = userId
         ? await User.findById(userId)
         : await User.findOne({username:username})
        const {email, password, phonenumber, ...other} = user._doc
        res.status(200).json(other)
    } catch (error) {
        return res.status(500).json("internal server error occured")
    
    }
}

exports.UpdateProfiles =async (req,res)=>{
    try {
        
        const user = await User.findById(req.params.id)
       
        if (!user) {
            return res.status(404).send('User not found');
          }
          user.set(req.body)// update user's profile image path
          const updateUser=await user.save();
      
          res.send(updateUser);

          
    } catch (error) {
        console.error(error);
    res.status(500).send('Internal server error');
    }
}

exports.EditUsers = async (req,res)=>{

    try {
        let userId = req.params.id
       
        let updateFields = req.body.updateFields;
       
          console.log(updateFields,"up");
        const user = await User.findByIdAndUpdate(userId,updateFields  , { new: true }  );
    
        
          res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}
exports.rejectReport=async (req, res) => {
    try {
      console.log(req.query.name,"test");
      var isPostFound=true
      const user = await User.findById(req.params.id);
  
      // const report = await Report.findById(req.query.id)
      if (!user) {
        res.status(403).json("user not found");
        isPostFound = false
      }
      if (req.user.isAdmin) {
        await user.updateOne({ $pull: { reports: req.query.name} })
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
      const user = await User.findById(req.params.id);
      // const report = await Report.findById(req.query.id)
      if (!user) {
        res.status(403).json("user not found");
        isPostFound = false
      }
      if (req.user.isAdmin) {
        await user.updateOne({ isBanned:true})
        await Report.deleteMany({_id:req.query.id})
        res.status(200).json("report resolved");
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

  exports.getNotifications = async (req, res)=>{
    try {
        const { id } = req.user;
        const notifiactions = await Notification.find({ user: id })
            .populate('friend', 'username profile')
            .populate('postId', 'image')
            .sort({ createdAt: -1 })
            .exec();
        res.status(200).json(notifiactions);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
}
