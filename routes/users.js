const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../config/config");
const { authenticate } = require("../auth/user.auth");

REGISTER: {
  router.post("/register", async (req, res) => {
    try {
      const { email, password, firstname, lastname, imageUrl = "" } = req.body;
      let exists = await User.findOne({ email });
      console.log("exists", exists);
      if (exists) {
        return res
          .status(200)
          .send({ exists: true, success: false, message: "Email is exist" });
      }
      const hashedPass = await bcrypt.hash(password, Number(config.saltRounds));

      let user = await User.create({
        email,
        password: hashedPass,
        firstname,
        lastname,
        imageUrl,
      });
      res.status(200).send({
        user,
        message: "User has registered successfully",
        success: true,
      });
    } catch (error) {
      res
        .status(400)
        .send({ error, message: "Registration failed", success: false });
    }
  });
}

LOGIN: {
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      let user = await User.findOne({ email });

      const isPassRight = await bcrypt.compare(password, user.password);
      if (!isPassRight) throw "credentials is not correct";

      const token = jwt.sign({ _id: user._id }, config.jwtPrivateKey);
      delete user.password;
      res.status(200).send({
        message: "User logged in successfully",
        success: true,
        user,
        token,
      });
    } catch (error) {
      res
        .status(404)
        .send({ error, message: "Logging in failed", success: false });
    }
  });
}

PROFILE: {
  // get profile data
  router.get("/profile", authenticate, async (req, res) => {
    try {
      const user = await User.findOne({ _id: req.signData._id }).populate({
        path: "blogs",
        populate: { path: "userId" },
      });
      console.log(user);
      res.status(200).send({
        success: true,
        user,
        isAuth: true,
        message: "User profile is fetched successfully",
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        error,
        isAuth: false,
        message: "User profile is not found or not Authorized",
      });
    }
  });
  // Get any user with id
  router.get("/user/:_id", async (req, res) => {
    try {
      const { _id } = req.params;
      const user = await User.findOne({ _id }).populate({
        path: "blogs",
        populate: { path: "userId" },
      });
      res.status(200).send({
        success: true,
        user,
        message: "User profile is fetched successfully",
      });
    } catch (error) {
      res.status(400).send({
        success: false,
        error,
        isAuth: false,
        message: "User profile is not found or not Authorized",
      });
    }
  });
}

DELETE_PATCH: {
  router
    .route("/")
    .patch(authenticate, async (req, res) => {
      try {
        console.log("noow");
        let updates = req.body;
        const { password } = await User.findById({ _id: req.signData._id });

        const isPassRight = await bcrypt.compare(updates.password, password);

        if (!isPassRight) throw "credentials is not correct";

        delete updates.password;
        const user = await User.findByIdAndUpdate(
          { _id: req.signData._id },
          { ...updates },
          { new: true }
        ).exec();
        res
          .status(200)
          .send({ user, success: true, message: "Updated successfully" });
      } catch (error) {
        res.status(401).send({ success: false, message: "Failed to updated" });
      }
    })
    .delete(authenticate, async (req, res) => {
      try {
        await User.deleteOne({ _id: req.signData._id });
        res
          .status(200)
          .send({ message: "successfully deleted", success: true });
      } catch (error) {
        res
          .status(404)
          .send({ error, message: "Failed to delete", success: false });
      }
    });
}

CHANGE_PASSWORD: {
  router.patch("/changepassword", authenticate, async (req, res) => {
    try {
      const { password, newPassword } = req.body;
      const { _id } = req.signData;
      let user = await User.findOne({ _id });
      /** compare the old password */
      const isPassRight = await bcrypt.compare(password, user.password);
      console.log(isPassRight, "\n");
      if (!isPassRight) throw "credentials is not correct";

      /** hashing the new password */
      const hashedPass = await bcrypt.hash(
        newPassword,
        Number(config.saltRounds)
      );

      user = User.findByIdAndUpdate(
        { _id: user._id },
        { password: hashedPass },
        {
          new: true,
        }
      ).exec();
      res.status(200).send({
        success: true,
        user,
        message: "Password updated successfully",
      });
    } catch (error) {
      res
        .status(400)
        .send({ success: false, error, message: "Faild to update" });
    }
  });
}
module.exports = router;
