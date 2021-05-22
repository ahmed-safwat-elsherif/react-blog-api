const express = require("express");
const { authenticate } = require("../auth/user.auth");
const { deleteOne, findOneAndUpdate } = require("../models/blogModel");
const Blog = require("../models/blogModel");
const User = require("../models/userModel");

const router = express.Router();

GET_COUNT_OF_BLOGS: {
  router.get("/all", async (req, res) => {
    try {
      const blogCount = await Blog.countDocuments();
      res.status(200).send({
        success: true,
        message: "number of blogs retrieved",
        blogCount,
      });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Can't retrieve count", error });
    }
  });
}

GET_COUNT_OF_USER: {
  router.get("/count/:userId", async (req, res) => {
    try {
      let { userId } = req.params;
      const blogCount = await Blog.countDocuments({
        userId,
      });
      res.status(200).send({
        success: true,
        message: "number of blogs retrieved",
        blogCount,
      });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Can't retrieve count", error });
    }
  });
}

GET_BLOG_BY_ID: {
  router.get("/blog/:_id", async (req, res) => {
    try {
      let { _id } = req.params;
      const blog = await Blog.findOne({ _id })
        .populate({
          path: "userId",
          select: "-password -blogs",
          populate: { path: "comments.userId" },
        })
        .populate({ path: "comments.userId", select: "-password -blogs" });

      if (!blog) throw "Unabled to find blog to display";

      res.status(200).send({ success: true, blog });
    } catch (error) {
      res.status(401).send({
        success: false,
        message: "Unabled to find blog to display",
        error,
      });
    }
  });
}

GET_ALL_BLOGS: {
  router.get("/", async (req, res) => {
    try {
      let { limit = 10, skip = 0 } = req.query;
      if (Number(limit) > 10) {
        limit = 10;
      }
      const blogs = await Blog.find()
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .populate({ path: "userId", select: "-password -blogs" })
        .exec();
      if (!blogs) throw "Unabled to find blogs to display";
      res.status(200).send({ success: true, blogs });
    } catch (error) {
      res.status(401).send({
        success: false,
        message: "Unabled to find blogs to display",
        error,
      });
    }
  });
}

POST_NEW_BLOG: {
  router.post("/new", authenticate, async (req, res) => {
    try {
      let userId = req.signData._id;
      let { title, body, tags = [] } = req.body;
      let blog = await Blog.create({
        userId,
        tags,
        title,
        body,
        likes: [],
        comments: [],
      });
      await User.findByIdAndUpdate(
        { _id: userId },
        { $push: { blogs: blog._id } }
      );
      res
        .status(200)
        .send({ success: true, message: "blog posted successfully", blog });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "error in posting blog", error });
    }
  });
}

GET_USERS_BLOGS: {
  router.get("/user/:id", authenticate, async (req, res) => {
    try {
      let userId = req.signData._id;
      let { limit = 10, skip = 0 } = req.query;
      if (Number(limit) > 10) {
        limit = 10;
      }
      const blogs = await Blog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .exec();
      if (!blogs) throw "Unabled to find blogs to display";
      res.status(200).send({ success: true, blogs });
    } catch (error) {
      res.status(401).send({
        success: false,
        message: "Unabled to find blogs to display",
        error,
      });
    }
  });
}

UPDATE_BLOG: {
  router.patch("/update/blog", authenticate, async (req, res) => {
    try {
      let { _id, userId, ...updates } = req.body;
      let blog = await Blog.findByIdAndUpdate(
        { _id },
        { ...updates },
        { new: true }
      ).exec();
      res
        .status(200)
        .send({ success: true, message: "Updated successfully", blog });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Failed to update", error });
    }
  });
}

DELETE_BLOG: {
  router.delete("/delete/blog/:_id", authenticate, async (req, res) => {
    try {
      let { _id } = req.params;
      await Blog.deleteOne({ _id });
      await User.findByIdAndUpdate(
        { _id: req.signData._id },
        { $pullAll: { blogs: [_id] } }
      );
      res.status(200).send({ success: true, message: "Deleted successfully" });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Failed to delete", error });
    }
  });
}

LIKES: {
  // Like a blog:
  router.patch("/blog/likes/:_id", authenticate, async (req, res) => {
    try {
      let { _id } = req.params;
      let userId = req.signData._id;
      let blog = await Blog.findOne({ _id });
      blog.likes.addToSet({ userId });
      let updatedBlog = await blog.save();
      res.status(200).send({ success: true, message: "Like it", updatedBlog });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Failed to like it", error });
    }
  });
  router.patch("/blog/dislikes/:_id", authenticate, async (req, res) => {
    try {
      let { _id } = req.params;
      let userId = req.signData._id;
      let blog = await Blog.findOne({ _id });
      blog.likes.pull({ userId });
      let updatedBlog = await blog.save();
      res
        .status(200)
        .send({ success: true, message: "disLike it", blog: updatedBlog });
    } catch (error) {
      res.send({ success: false, message: "Failed to dislike it", error });
    }
  });
}

COMMENTS: {
  router.post("/comments/new", authenticate, async (req, res) => {
    try {
      let { comment, _id } = req.body;
      let blogQuery = await Blog.findOne({ _id });

      blogQuery.comments.push({
        isUserDeleted: false,
        userId: req.signData._id,
        comment,
      });
      let result = await blogQuery.save();
      let blog = await Blog.findOne({ _id })
        .populate({
          path: "userId",
          select: "-password -blogs",
          populate: { path: "comments.userId" },
        })
        .populate({ path: "comments.userId", select: "-password -blogs" });
      res
        .status(200)
        .send({ success: true, message: "Comment added successfully", blog });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, message: "Failed to add a comment", error });
    }
  });
  router
    .route("/blog/:blogId/comments/delete/:_id")
    .delete(authenticate, async (req, res) => {
      try {
        let { _id, blogId } = req.params;

        let blog = await Blog.findByIdAndUpdate(
          { _id: blogId },
          {
            $pull: { comments: { _id } },
          },
          { new: true }
        )
          .populate({
            path: "userId",
            select: "-password -blogs",
            populate: { path: "comments.userId" },
          })
          .populate({ path: "comments.userId", select: "-password -blogs" });

        res.status(200).send({
          success: true,
          message: "deleted successfully",
          blog,
        });
      } catch (error) {
        res
          .status(401)
          .send({ message: "Unable to delete", error, success: false });
      }
    })
    .patch(authenticate, async (req, res) => {
      try {
        let commentId = req.query._id;
        let { _id, userId, update } = req.body;
        let blog = await Blog.findById({ _id });
        let index = blog.comments.indexOf((c) => c._id == commentId);
        blog.comments[index].comment = update;
        let updated = await blog.save();
        res.status(200).send({
          success: true,
          message: "Updated successfully",
          blog: updated,
        });
      } catch (error) {
        res
          .status(400)
          .send({ success: false, message: "Unable to update", error });
      }
    });
}
module.exports = router;
