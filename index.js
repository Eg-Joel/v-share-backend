const express = require("express")
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const userRouter = require("./router/user")
const postRouter = require("./router/Post")
const adminRouter = require("./router/admin")
const conversationRouter=require("./router/conversations")
const messageRouter = require("./router/messages")
const cors = require("cors");
const socket = require('socket.io')
dotenv.config()


mongoose.connect(process.env.MONGODB).then(()=>{
    console.log("database connected");
})
const server = app.listen(5000,()=>{
  console.log("server is running");
})

app.use(cors({
    origin: ["https://main.davhptqe3sdlw.amplifyapp.com","http://localhost:3000","https://v-share.fun"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    
  }));

  
const io = socket(server,{
    cors:{
        origin:["http://localhost:3000","https://main.davhptqe3sdlw.amplifyapp.com"],
        methods:["GET","POST"],
        
    },
})

let users = []

const addUser = (userId,socketId) =>{
    !users.some((user)=> user.userId === userId) &&
    users.push({userId , socketId})
}

const removeUser = (socketId)=>{
    users = users.filter((user)=>user.socketId !== socketId)
}

const getUser = (userId)=>{
    return users.find(user =>user.userId === userId)
}

io.on("connection", (socket) => {
    //when connect
    console.log("user connected");
   
    //take userId & socketId from user
    socket.on("addUser",userId=>{
      addUser(userId,socket.id)
      io.emit("getUsers",users)
    })

    //send and get message
    socket.on("sendMessage", ({senderId,receiverId,text})=>{
      const user = getUser(receiverId)
     
      io.to(user?.socketId).emit("getMessage",{
        senderId,
        text,
      })
    })


    //when disconnect
    socket.on("disconnect",()=>{
        console.log(" a user disconnected");
        removeUser(socket.id)
        io.emit("getUsers",users)
  });

   
  })

// app.use(cors());

app.use(express.json())
app.use("/api/user",userRouter)
app.use("/api/post",postRouter)
app.use("/api/admin",adminRouter)
app.use("/api/conversation",conversationRouter)
app.use("/api/message",messageRouter)

// Set CORS headers


