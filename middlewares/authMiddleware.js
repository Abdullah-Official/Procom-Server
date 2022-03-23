import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authMiddleware = (req, res, next) => {
  const JWT_SECRET = process.env.secret || "test";
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "You must be logged in." });
  }
  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "You must be logged in." });
    }
    const { _id } = payload;
    User.findById(_id).then((userdata) => {
      req.user = userdata;
      next();
    });
  });
};

export default authMiddleware;
