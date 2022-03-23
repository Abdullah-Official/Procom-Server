import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import cors from "cors";
import userRouters from "./routers/users.js";
import dotenv from "dotenv";
import errorHandler from "./helpers/error-handler.js";

const app = express();
dotenv.config();

app.use(cors());
app.options("*", cors());

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));
app.use(errorHandler);

// .env variables
const api = process.env.API_URL;
const PORT = process.env.PORT || 8000;

// Routers
app.use(`${api}/users`, userRouters);

// database connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected Successfully ..");
  })
  .catch((err) => console.log(err, " ERR"));

//Main End Point

if(process.env.NODE_ENV == 'production'){
  app.get('/', (req,res) => {
    res.send("PROCOM BACKEND IS LIVE IN PRODUCTION")
  })
}
app.get('/', (req,res) => {
  res.send("PROCOM BACKEND IS LIVE IN DEVELOPMENT")
})

//server connection
app.listen(PORT, () => {
  console.log(api);
  console.log("Server is running on port " + PORT);
});

