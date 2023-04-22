const router = require("express").Router()
const { newConversation, getConv, getConvIncTwo } = require("../controllers/conversationcontroller");
const { verifyToken } = require("../middlewares/verifyToken")

//new conversation
router.post("/con",verifyToken, newConversation);

//get conv of a user

router.get("/:userId",verifyToken, getConv);

// get conv includes two userId

router.get("/find/:firstUserId/:secondUserId",verifyToken, getConvIncTwo);

 
module.exports = router