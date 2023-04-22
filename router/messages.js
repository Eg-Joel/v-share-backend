const router = require("express").Router()
const { addMessage, getMessage } = require("../controllers/messageController");
const {verifyToken  } = require("../middlewares/verifyToken")

//add
router.post("/",verifyToken, addMessage);

//get

router.get("/:conversationId",verifyToken, getMessage);

module.exports = router