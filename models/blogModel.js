const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const blogSchema = mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    tags: [
      {
        type: String,
      },
    ],
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    likes: [{ userId: { type: Schema.Types.ObjectId, ref: "User" } }],
    comments: [
      {
        isUserDeleted: { type: Boolean },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: { createdAt: "createdAt" } }
);
const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
