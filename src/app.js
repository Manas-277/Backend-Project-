import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'


const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//data
app.use(express.json({limit: "16kb"}));
//configure URL Data
app.use(express.urlencoded({extended: true, limit: "16kb"}));
//pdf, images, public assets
app.use(express.static("public"));
//cookieparser
app.use(cookieParser());


//Routes import
import userRouter from './routes/user.routes.js'
//routes declaration
app.use("/api/v1/users", userRouter);
// https://localhost:8000/api/v1/users/register
export {app}; 