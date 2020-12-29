const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
    username: {
        type: String,
        required: [true, "username required"],
        minlength: [1, "username must be at least 1 character long"],
        maxlength: [20,"username cannot be more than 20 characters long"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "password required"],
        minlength: [1, "password must be at least 1 character long"],
    },
    userType: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        default: "This is my bio..."
    },
    pic: {
        type: String,
        default: "https://www.villascitemirabel.com/wp-content/uploads/2016/07/default-profile.png"
    },
    peopleFollowing: [{ type: Schema.Types.ObjectId, ref: 'Person'}],
    usersFollowing: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review'}],
    recommendations: [{ type: Schema.Types.ObjectId, ref: 'Movie'}],
    inbox: [String]
});


userSchema.statics.findByUsername = function(name, callback){
	this.find({username: new RegExp(name, 'i')}, callback);
}

module.exports = mongoose.model("User", userSchema);