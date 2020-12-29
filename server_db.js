const express = require('express');
let app = express();
let genre = require("./genre.json");
const path = require("path")
app.set("view engine", "pug");
const session = require('express-session');
const mongoose = require('mongoose');
let User = require("./user_model");
let Movie = require("./movie_model");
let Person = require("./person_model");
let Review = require("./review_model");
let movieRouter = require("./movie_router");
let personRouter = require("./person_router");
let userRouter = require("./user_router")

mongoose.connect('mongodb://localhost/moviedb', {useNewUrlParser: true});
let db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', ()=> {
	console.log("Connected to moviedb database");
	app.listen(3000);
	console.log("Server listening at http://localhost:3000");
});

app.use(session({ secret: '53CR37 M3554G3'}))
app.use(express.json());
app.use(express.static("public", {index: "login.html"}));
app.use(express.urlencoded({extended: true}));

app.use(function(req,res,next){
	console.log("METHOD: " + req.method);
	console.log("   URL: " + req.url);
	console.log(req.session);
	next();
});

app.use("/movies", movieRouter);
app.use("/people", personRouter);
app.use("/users", userRouter)

app.get("/", (req, res)=> { res.sendFile(path.join(__dirname + '/public/login.html')) });
app.get("/search", auth, getSearch);
app.post("/reviews", auth, loadSessionUser, createReview, updateRevMovie, notifyFollowers);
app.get("/home", auth, loadSessionUser, loadFeaturedMovies, getHome);
app.get("/contribute", auth, loadSessionUser, getContribute);
app.get("/profile", auth, loadSessionUser, loadRecommMovies, updateRecommMovies, getProfile);
app.put("/profile", auth, loadSessionUser, changeUserType);
app.delete("/notifications", auth, loadSessionUser, deleteNotifs);
app.post("/login", login);
app.post("/signup", signup);
app.get("/logout", logout);

function auth(req, res, next) {
    if(!req.session.loggedin) {
        res.redirect("/");
        return;
	}
    next();
}

function loadSessionUser(req,res,next){	
	User.findOne().where("username").equals(req.session.username)
	.populate("peopleFollowing", "_id name")
	.populate("usersFollowing", "_id username")
	.populate({
        path: 'reviews',
        populate: { path: 'movieID', select: "title poster _id"},
	})
	.exec((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error reading user data.");
			return;
		}
		if(!result){
			res.status(404).send("Unknown user.");
			return;
		}
		req.sessionUser = result;
		next();
	});
}

function loadRecommMovies(req, res, next){
	if(req.sessionUser.reviews.length==0){
		Movie.countDocuments((err, count)=> {
			if(err){
				console.log(err);
				res.status(500).send("Server error");
				return;
			}
			let numMovies = count < 3 ? count : 3;
			let rand = Math.floor(Math.random() * (count-numMovies));
			Movie.find().skip(rand).limit(numMovies).select("_id").exec((err,results)=>{
				if(err){
					console.log(err);
					res.status(500).send("Server error.");
					return;
				}
				req.sessionUser.recommendations = results;
				next();
			});
		});
	}else{
		let i = Math.floor(Math.random() * req.sessionUser.reviews.length);
		let randMovieID = req.sessionUser.reviews[i].movieID._id;
		let moviesReviewed = []
		req.sessionUser.reviews.forEach(review=>{
			moviesReviewed.push(review.movieID._id)
		})
		Movie.findById(randMovieID).exec((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Server error.");
				return;
			}
			result.findRecMovies(moviesReviewed,(err,results)=>{
				if(err){
					console.log(err);
					res.status(500).send("Server error.");
					return;
				}
				req.sessionUser.recommendations = results;
				next();
			})
		})
	}
}

function updateRecommMovies(req,res,next){
	req.sessionUser.save((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");
			return;
		}
		Movie.populate(req.sessionUser, {path:"recommendations", select: "_id title poster"}, (err, result)=> {  
			if(err){
				console.log(err);
				res.status(500).send("Server error.");
				return;
			}
			next();
		})
	})
}

function createReview(req, res, next){
	let r = new Review({userID: req.sessionUser._id, movieID: req.body.mid, rating: req.body.rating, briefSummary: req.body.briefSummary, content: req.body.content});
	r.save((err, result)=>{
		if(err){
			console.log(err);
			res.status(500).send(err.message);
			return;
		}
		req.sessionUser.reviews.push(r._id);
		req.sessionUser.save((err, result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Server error");
				return;
			}
			Movie.findById(req.body.mid).populate("reviews").exec((err,result)=>{
				if(err){
					console.log(err);
					res.status(500).send("Server error");
					return;
				}
				if(!result){
					console.log(err);
					res.status(500).send("Server error");
					return;
				}
				req.review = r;
				req.reviewedMovie = result;
				next();
			});
		});
	});
}

function updateRevMovie(req,res,next){
	req.reviewedMovie.reviews.push(req.review);
	let totalScore = 0;
    let totalReviews = 0;
    req.reviewedMovie.reviews.forEach(review => {
        totalScore += review.rating;
        totalReviews++;
	});
    req.reviewedMovie.averageRating = Math.round(totalScore/totalReviews * 10) / 10;
	req.reviewedMovie.save((err, result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error updating movie.");
			return;
		}
		next();
	});
}

function notifyFollowers(req, res, next){
	//notify followers that the user made a review
	let notification = req.sessionUser.username + " made a review for " + req.reviewedMovie.title;
	User.updateMany( { usersFollowing: req.sessionUser._id }, { $push: {inbox: notification}}, (err, results)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");
			return;
		}
		res.redirect("/movies/"+req.body.mid);
	});
}

function deleteNotifs(req, res){
	req.sessionUser.inbox = [];
	req.sessionUser.save((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error updating user data.");
			return;
		}
		res.status(200).send();
	});	
}

function getContribute(req, res){ 
	if(req.sessionUser.userType === false) {
		res.redirect("/profile");
		return;
	}
	res.status(200).render("pages/contribute", {genre}); 
}

function getSearch(req, res){ 
	let searchResults = [];
	res.status(200).render("pages/search", {searchResults, type:{}, genre, search:true}); 
}

function loadFeaturedMovies(req, res, next){
	Movie.countDocuments((err, count)=> {
		if(err){
			console.log(err);
			res.status(500).send("Error loading movie data");
			return;
		}
		let numMovies = count < 24 ? count : 24;
		let rand = Math.floor(Math.random() * (count-numMovies));
		Movie.find().skip(rand).limit(numMovies).exec((err,results)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error loading movie data");
				return;
			}
			res.movies = results;
			next();
		});
	});
}

function getHome(req, res) {
	res.status(200).render("pages/home", {movies:res.movies, notifications:req.sessionUser.inbox});
}

function getProfile(req, res){ 
	res.status(200).render("pages/profile", {user:req.sessionUser}); 
}

function changeUserType(req, res){
	req.sessionUser.userType = req.body.userType;
	req.sessionUser.save((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error updating user data.");
			return;
		}
		res.status(200).send();
		return;
	});
}

function login(req, res, next){
	username = req.body.username;
	password = req.body.password;
	User.findOne().where("username").regex(new RegExp('^'+ username + '$', "i")).exec((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");			
			return;
		}
		if(!result){
			res.status(404).send("user with that username does not exist.");
			return;
		}
		if(result.password == password){
			req.session.username = result.username;
			req.session.loggedin = true;
			res.status(200).send();
			return;
		}
		res.status(401).send("password is incorrect.");
	});
}

function signup(req, res, next) {
    let username = req.body.username;
	let password = req.body.password;
	User.findOne().where("username").regex(new RegExp('^'+ username + '$', "i")).exec((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");			
			return;
		}
		if(!result){
			let u = new User({username: username, password: password});
			u.save((err,result)=>{
				if(err){
					console.log(err);
					res.status(500).send(err.message);
					return;
				}
				req.session.username = result.username;
				req.session.loggedin = true;
				res.status(200).send();
				return;
			});
		}else{
			res.status(404).send("username already exists.");
		}
		
	});
}

function logout(req, res) {
    if(req.session.loggedin) {
        req.session.loggedin = false;
    }
    res.redirect("/");
}