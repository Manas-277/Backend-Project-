import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId, //the one who is subscribing
        req: "User"
    },
    channel:{
        type: Schema.Types.ObjectId, //the one to whome the subscriber is subscribing
        req: "User"
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema);