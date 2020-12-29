const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let movieSchema = Schema({
	title: {
        type: String,
        required: [true, "title required"],
        minlength: [1, "title must be at least 1 character long"],
        maxlength: [60,"title cannot be more than 60 characters long"],
        trim: true
    },
    averageRating: {
        type: Number,
        default: 0,
    },
    releaseYear: {
        type: Number,
        required: [true, "releaseYear required"],
        validate: {
			validator: function(v){ return (v>=1000 && v <= 9999); },
			message: "release year must be a 4-digit number"
		}
    },
    rated: {
        type: String,
        default: "Not Rated"
    },
    released: {
        type: String
    },
    runtime: {
        type: Number,
        required: [true, "runtime required"],
        validate: {
			validator: function(v){ return (v>=10 && v <= 999); },
			message: "runtime must be a number with 2-3 digits"
		}
    },
    genre: {
        type: [String],
        required: [true, "genre required"],
        enum: ["Animation","Adventure","Comedy","Family","Fantasy","Romance","Drama","Crime","Thriller","Western","Action","Horror","History","Biography","Mystery","Sci-Fi","War","Musical","Sport","Music","Documentary","Short","Film-Noir","News"],
        validate: {
			validator: function(v){ return (v.length>=1); },
			message: "movie must contain at least one genre"
		}
    },
    directors: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Person'}],
        //required: true
    },
    writers: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Person'}],
        //required: true
    },
    actors: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Person'}],
        //required: true
    },
    plot: {
        type: String,
        required: [true, "plot required"],
        maxlength: [1000, "bio cannot be more than 1000 characters long"]
    },
    language: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    awards: {
        type: String,
        default: ""
    },
    poster: {
        type: String,
        default: "https://icon-library.com/images/no-photo-icon/no-photo-icon-28.jpg"
    },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review'}],
    similar: [{ type: Schema.Types.ObjectId, ref: 'Movie'}]
});

movieSchema.methods.findSimilarMovies = function(callback){
    this.model("Movie").find().where("_id").ne(this._id).where("genre").all(getGenreArr(this.genre)).limit(3).select("_id").exec(callback);
}

movieSchema.methods.findRecMovies = function(moviesReviewed, callback){
    this.model("Movie").find().where("_id").nin(moviesReviewed).where("genre").all(getGenreArr(this.genre)).limit(3).select("_id").exec(callback);
}

function getGenreArr(genre){
    let minGenres = genre.length < 2 ? genre.length : 2;
    let genreArr = [];
    let count = 0;
    do{
        let i = Math.floor(Math.random() * genre.length);
        let curGenre = genre[i];
        if (!genreArr.includes(curGenre)){
            genreArr.push(curGenre);
            count++;
        }
    } while (count<minGenres)
    return genreArr;
}

module.exports = mongoose.model("Movie", movieSchema);