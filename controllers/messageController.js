const Message = require("../models/Message");



exports.newConversation=async (req, res) => {
    const newConversation = new Conversation({
      members: [req.body.senderId, req.body.receiverId],
    });
  
    try {
      const savedConversation = await newConversation.save();
      res.status(200).json(savedConversation);
    } catch (err) {
      res.status(500).json(err);
    }
  }

//   const conversation = Conversation.findById(req.body.conversationId)
//     console.log(req.body.conversationId);
// conversation.updateOne({$inc:{lastMsg:1}}).then(res=>console.log(res))
// if(req.body.sendNot){
// NotificationModel.create({
//       userId: req.body.receiverId,
//       emiterId: req.user.id,
//       text: 'just sent you a message',
//       postId: req.body.conversationId
// })}
exports.addMessage=async (req, res) => {
    const newMessage = new Message(req.body);
    
    try {
      const savedMessage = await newMessage.save();
     
      res.status(200).json(savedMessage);
    } catch (err) {
      res.status(500).json(err);
    }
  }

  
  exports.getMessage=async (req, res) => {
    try {
      
      const messages = await Message.find({
        conversationId: req.params?.conversationId,
      });
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json(err);
    }
  }

