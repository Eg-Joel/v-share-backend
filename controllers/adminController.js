const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require("../models/admin")
const { validationResult } = require("express-validator");
const adminServies = require('../services/adminServices');
const jwtSEC = "#2idfbfb$%TTtrr123##"

module.exports = {
    adminLogin:async(req,res)=>{

        const error = validationResult(req)
        // if(!error.isEmpty()){
        //     return res.status(400).json('some error occured')
        // }
        // try {
            
        
        const admin = await Admin.findOne({email:req.body.email})
        if(!admin){
            return res.status(400).json("user not found")
        }
    
        const ComparePassword = await bcrypt.compare(req.body.password,admin.password)
        if(!ComparePassword){
            return res.status(400).json("Password error")
        }
    
        // check if user is admin
        if(!admin.isAdmin){
            return res.status(403).json("Unauthorized");
        }
    
        const accessToken = jwt.sign({
            id:admin._id,
            username:admin.username,
            isAdmin: admin.isAdmin
        },jwtSEC)
        const {password , ...other} = admin._doc
        
        
        res.status(200).json({other,accessToken})
    // } catch (error) {
    //         res.status(500).json('internal error occured')
    // }
    },

    getUsers:async(req,res)=>{
        try {
            const { pageNumber } = req.params;
            const listSize = 5;
            const userCount = await adminServies.userCount()
            const currUsers = listSize * (pageNumber - 1)
            const pageCount = Math.ceil(userCount / listSize);

            const users= await adminServies.getPaginatedUsers(listSize,currUsers)
            
            res.json({status:true , data:{pageCount,users}})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    searchUser:async (req,res)=>{
        try {
            const {value} = req.params
            const pageSize = 5
            const users = await adminServies.searchUsers(pageSize,value)
            res.json({status:true,data:users})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    banUser:async(req,res)=>{
        try {
            console.log("hi");
            const {id} = req.body
            const banned = await adminServies.banUser(id)
            res.json({status:true , data:banned})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    unBanUser:async(req,res)=>{
        try {
            const {id} = req.body
            const banned = await adminServies.unBanUser(id)
            res.json({status:true , data:banned})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
GetAmount: async(req,res)=>{
try {
    const userCount = await adminServies.userCount()
    const postCount = await adminServies.postCount()
    res.status(200).json(userCount,postCount);
} catch (error) {
    res.json({status:false , message:'internal Server error',error})
}
},
    // post management
    getPosts:async(req,res)=>{
        try {
            const { pageNumber } = req.params;
            const listSize = 5;
            const userCount = await adminServies.postCount()
            const currPosts = listSize * (pageNumber - 1)
            const pageCount = Math.ceil(userCount / listSize);
            const posts= await adminServies.getPaginatedPosts(listSize,currPosts)
           
            res.json({status:true , data:{pageCount,posts}})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    searchPosts:async (req,res)=>{
        try {
            const {value} = req.params
            const pageSize = 5
            const posts = await adminServies.searchPosts(pageSize,value)
            res.json({status:true,data:posts})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    banPost:async(req,res)=>{
        try {
            const {id} = req.body
            const banned = await adminServies.banPost(id)
            res.json({status:true , data:banned})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    unBanPost:async(req,res)=>{
        try {
            const {id} = req.body
            const banned = await adminServies.unBanPost(id)
            res.json({status:true , data:banned})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    // reports
    getReports:async(req,res)=>{
        try {
            const { pageNumber } = req.params;
            const listSize = 6;
            const userCount = await adminServies.reportCount()
            const count = userCount[0].count
            const currPosts = listSize * (pageNumber - 1)
            const pageCount = Math.ceil(count / listSize);
            const reports= await adminServies.getReports(listSize,currPosts)
            res.json({status:true , data:{pageCount,reports}})
        } catch (error) {
            res.json({status:false , message:'internal Server error',error})
        }
    },
    
}
