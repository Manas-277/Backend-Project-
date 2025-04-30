import mongoose ,{mongo, Schema, Types} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    videoFile:{
        type: String,
        required: true,
    },
    thumbnail:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    duration:{
        type: Number,// duration provided by cloudanry
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    videoCreator:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"videoCreator"
    }
},{timestamps: true});


videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);