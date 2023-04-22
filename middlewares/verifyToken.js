const jwt = require('jsonwebtoken');
const jwtSEC = "#2idfbfb$%TTtrr123##"

const verifyToken = (req,res,next)=>{
   
    const authHeader = req.headers.token;
   
    if(authHeader){
        const token = authHeader;
        jwt.verify(token, jwtSEC , (err,user)=>{
            if(err) return res.status(400).json("some error occured")
            req.user= user;
            next()
        })
    }else{
        return res.status(400).json("Access token is not vaild")
    }
    
}
const isAdmin = (req, res, next) => {
    const user = req.user;
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  };
module.exports = {verifyToken,isAdmin }