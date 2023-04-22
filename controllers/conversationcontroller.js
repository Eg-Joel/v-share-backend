const Conversation = require("../models/Conversation");


exports.newConversation=async (req, res) => {
       const id  = req.user.id;
      const   friendId  = req.body.friendId;
  
      
        // req.body.senderId, req.body.receiverId

      // Check if there is a conversation already existing between the two members
    const existingConvo = await Conversation.findOne({
    members: { $all: [id, friendId] }
    }); 
    
    if (existingConvo) {
        
        return res.status(200).json(existingConvo);
    }
    
    const newConversation = new Conversation({
      members: [id,friendId],
    });
  
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) {
      res.status(500).json(err);
    }
  }


  exports.getConv=async (req, res) => {
    try {
      const conversation = await Conversation.find({
        members: { $in: [req.params.userId] },
      });
      res.status(200).json(conversation);
    } catch (err) {
      res.status(500).json("err");
    }
  }

  
  exports.getConvIncTwo=async (req, res) => {
    try {
     
   
      const conversation = await Conversation.findOne({
        members: { $all: [req.params.firstUserId, req.params.secondUserId] },
      });
      res.status(200).json(conversation)
    } catch (err) {
      res.status(500).json("err");
    }
  }