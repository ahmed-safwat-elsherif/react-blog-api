const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    minLength: 3,
    maxLength: 20,
  },
  lastname: {
    type: String,
    minLength: 3,
    maxLength: 20,
  },
  imageUrl: {
    type: String,
  },
  blogs: [{ type: Schema.Types.ObjectId, ref: "Blog" }],
});
const User = mongoose.model("User", userSchema);

module.exports = User;
