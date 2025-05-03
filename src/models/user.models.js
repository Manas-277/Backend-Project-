import mongoose, {Schema} from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //searchable easily for DB
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName:{
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //cloudnary ka url use karenge
        required: true,
    },
    coverImage:{
        type: String
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type: String, 
        required: [true, `Password is Required!`]
    },
    refreshToken:{
        type: String
    }
},
{timestamps: true}
)

//pre is a middleware used just before saving or any operation from the DB
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
} ) //dont use arroy function here because we need reference here


userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password); //return T/F
}




//__________________JWT is a bearer token_______
// key or token jiske bhi pass hai jo mujhe bhejega mai usko data bhej dunga
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id, //will get from DB
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id, //will get from DB
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function(){}
export const User = mongoose.model("User", userSchema)