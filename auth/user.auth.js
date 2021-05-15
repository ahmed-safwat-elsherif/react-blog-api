const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");
module.exports.authenticate = async (req, res, next) => {
  try {
    let { authorization } = req.headers;
    console.log({ authorization });
    authorization = authorization.split(" ");
    if (authorization.length == 2) {
      authorization = authorization[1];
    } else {
      authorization = authorization[0];
    }
    const signData = jwt.verify(authorization, config.jwtPrivateKey);
    req.signData = signData;
    let user = await User.findOne({ _id: req.signData._id });
    if (!user) throw Error("User doesn't exist");
    next();
  } catch (error) {
    res
      .status(401)
      .send({ success: false, error: "User Authorization failed" });
  }
};
