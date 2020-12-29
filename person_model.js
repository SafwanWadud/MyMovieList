const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let personSchema = Schema({
	name: {
        type: String,
        required: [true, "name required"],
        minlength: [1, "name must be at least 1 character long"],
        maxlength: [40,"name cannot be more than 40 characters long"],
        trim: true
    },
    directed: [{ type: Schema.Types.ObjectId, ref: 'Movie'}],
    written: [{ type: Schema.Types.ObjectId, ref: 'Movie'}],
    acted: [{ type: Schema.Types.ObjectId, ref: 'Movie'}],
    freqCollabs: [{ type: Schema.Types.ObjectId, ref: 'Person'}],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    bio: {
        type: String,
        maxlength: [1000, "bio cannot be more than 1000 characters long"],
        default: "This is the person's bio..."
    },
    pic: {
        type: String,
        default: "https://www.villascitemirabel.com/wp-content/uploads/2016/07/default-profile.png"
    }
});

personSchema.methods.findMoviesWorked = function(callback){
    this.model("Movie").find()
    .or([{directors: {"$in": [this._id]}}, {writers: {"$in": [this._id]}}, {actors: {"$in": [this._id]}}])
    .exec(callback);
}

personSchema.statics.findByName = function(name, callback){
	this.find({name: new RegExp(name, 'i')}, callback);
}

module.exports = mongoose.model("Person", personSchema);