import 'dotenv/config'
import connectDB from './db/index.js';

connectDB();






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
