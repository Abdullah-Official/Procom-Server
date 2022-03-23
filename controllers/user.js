import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import crypto from "crypto";
import { responseCodes } from "../utils/response_codes.js";

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API || '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');

export const signin = async (req, res) => {
  const { email, password } = req.body;
  const secret = process.env.secret || "test";
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res
        .status(responseCodes.CODE_NOT_FOUND)
        .json({ message: "User doesnt exists.." });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect)
      return res
        .status(responseCodes.CODE_BAD_REQUEST)
        .json({ message: "Invalid Credentials" });
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      secret,
      { expiresIn: "1h" }
    );
    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ result: existingUser, token });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const signup = async (req, res) => {
  const { email, firstName, lastName, password, phone } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(responseCodes.CODE_BAD_REQUEST)
        .json({ message: "User already exists.." });
    // if(password !== confirmPassword) return res.status(responseCodes.CODE_BAD_REQUEST).json({message:'Password dont match'})

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    });
    const token = jwt.sign({ email: result.email, id: result._id }, "test", {
      expiresIn: "1h",
    });

    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ result, token });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const userList = await User.find().select("-password");

    if (!userList) {
      return res
        .status(500)
        .json({ success: false, message: "No users found!" });
    }
    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ data: userList, success: true });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById({ _id: id }).select("-password");

    if (!user) {
      return res
        .status(500)
        .json({ success: false, message: "No user found!" });
    }
    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ data: user, success: true });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong." });
  }
};

export const getUsersCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (!userCount) {
      res
        .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
        .json({ success: false });
    }
    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ data: userCount, success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong.", error });
  }
};

export const deleteUser = async (req, res) => {
  try {
    User.findByIdAndRemove(req.params.id)
      .then((user) => {
        if (!user) {
          return res
            .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
            .json({ message: "User cannot be deleted" });
        } else {
          return res
            .status(responseCodes.CODE_RESPONSE_SUCCESS)
            .json({ success: true, message: "User deleted" });
        }
      })
      .catch((err) => {
        return res
          .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
          .json({ success: false, error: err });
      });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong.", error });
  }
};

export const updateUser = async (req, res) => {
  try {
    const realuser = await User.findById(req.params.id);
    const user = await User.findByIdAndUpdate(
      req.params.id,

      {
        firstName: !req.body.firstName
          ? realuser.firstName
          : req.body.firstName,
        lastName: !req.body.lastName ? realuser.lastName : req.body.lastName,
        email: !req.body.email ? realuser.email : req.body.email,
        phone: !req.body.phone ? realuser.phone : req.body.phone,
      },
      { new: true }
    );
    if (!user) {
      return res
        .status(500)
        .json({ success: false, message: "No User found!" });
    }
    return res
      .status(responseCodes.CODE_RESPONSE_SUCCESS)
      .json({ user: user, success: true });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong.", error });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        return res.json({ error: err });
      }
      const token = buffer.toString("hex");
      User.findOne({ email: req.body.email }).then((user) => {
        if (!user) {
          return res
            .status(responseCodes.CODE_BAD_REQUEST)
            .json({ error: "User dont exists with that email" });
        }
        user.resetToken = token;
        user.expireToken = Date.now() + 3600000;
        user.save().then((result) => {
          sgMail
            .send({
              to: user.email,
              from: "abdullahanis2601@gmail.com",
              subject: "Reset Your Password!",
              html: `
        <p>You requested for password reset</p>
        <h5>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset password</h5>
        `,
            })
            .then(() => {
              res
                .status(responseCodes.CODE_RESPONSE_SUCCESS)
                .json({ message: "Email send successfully..!." });
            })
            .catch((error) => {
              res
                .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
                .json({ message: "Something went wrong.", error });
            });
        });
      });
    });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong.", error });
  }
};

export const newPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const sentToken = req.body.token;
    User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
      .then((user) => {
        if (!user) {
          return res.status(422).json({ error: "Try again session expired" });
        }
        bcrypt.hash(newPassword, 12).then((hashedpassword) => {
          user.password = hashedpassword;
          user.resetToken = undefined;
          user.expireToken = undefined;
          user.save().then((saveduser) => {
            return res
              .status(200)
              .json({ message: "password updated success" });
          });
        });
      })
      .catch((err) => {
        console.log(err);
        return res
          .status(500)
          .json({ message: "Something went wrong.", error });
      });
  } catch (error) {
    return res
      .status(responseCodes.CODE_INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong.", error });
  }
};
