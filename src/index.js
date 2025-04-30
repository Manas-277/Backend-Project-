import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
.then(() => {
const server = app.listen(process.env.PORT || 8000, () => {
    console.log(`App is listening on PORT ${process.env.PORT || 8000}...`);
});

// Handle server errors
server.on("error", (err) => {
    console.error(`Server failed to start: ${err.message}`);
});
})
.catch((err) => {
console.log(`MONGO DB CONNECTION FAILED!! ${err}`);
});





























//APPROACH 1: To write the DB connection inside the index file and run the function through IFFE
/*
import mongoose from 'mongoose'
import { DB_NAME } from './constants';
import express from 'express'
const app = express()

;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on('error', ()=>{
            console.log('Error', error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("ERROR: ", error);
        throw error;
    }
})();

*/
