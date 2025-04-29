//APPROACH 2: In a different file, WRITE THE FUNCTION TO CONNECT DB AND IMPORT THAT TO THE MAIN INDEX FILE

import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async ()=>{
    try { 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected :) DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection failed: ", error);
        process.exit(1);
    }
}

export default connectDB;