const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let reviewSchema = Schema({
	rating: {
        type: Number,
        required: [true, "rating required"],
        validate: {
			validator: function(v){ return (v>=1 && v <= 10); },
			message: "rating must be between 1-10"
		}
    },
    briefSummary: {
        type: String,
        required: [checkReview, "a full review must contain both a brief summary and content"],
        maxlength: 100
        
    },
    content: {
        type: String,
        required: [checkReview, "a full review must contain both a brief summary and content"],
        maxlength: 2000
    },
    userID: { type: Schema.Types.ObjectId, ref: 'User'},
    movieID: { type: Schema.Types.ObjectId, ref: 'Movie'}
});

function checkReview(){
    return this.briefSummary || this.content;
}

module.exports = mongoose.model("Review", reviewSchema);