const mongoose = require('mongoose');
const express = require('express');
let genre = require("./genre.json");
const ObjectId = require('mongoose').Types.ObjectId
let Movie = require("./movie_model");
let Person = require("./person_model");
let User = require("./user_model");
let router = express.Router();

router.post("/", createMovie, notifyFollowers);
router.put("/:mid", auth, editMovie, saveMovie, notifyFollowers);
router.get("/", queryParser, loadMovies, loadAllSimilarMovies, getMovies);
router.get("/:mid", loadSimilarMovies, loadSessionUser, getMovie);

function loadSimilarMovies(req, res, next){
    if(!req.movie){
        next();
        return;
    }
    req.movie.findSimilarMovies((err,results)=>{
        if(err){
			console.log(err);
			res.status(500).send("Error loading movies.");
			return;
        }
        req.movie.similar = results;
        req.movie.save((err,result)=>{
            if(err){
                console.log(err);
                res.status(500).send("Error loading movies.");
                return;
            }
            Movie.populate(req.movie, {path:"similar", select: "_id title poster"}, (err, result)=> {  
                if(err){
                    console.log(err);
                    res.status(500).send("Error loading movies.");
                    return;
                }
                next();
            })
        })
    })
}

function loadSessionUser(req,res,next){	
    if(!req.session.username){
        next();
        return;
    }
	User.findOne().where("username").equals(req.session.username).exec((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error reading user data.");
			return;
		}
		if(!result){
			res.status(404).send("Could not find session user.");
			return;
		}
		req.sessionUser = result;
		next();
	});
}


function loadAllSimilarMovies(req, res, next){
    if(res.movies.length==0) {
        next();
        return;
    }
    let count = 0;
    res.movies.forEach(movie =>{
        movie.findSimilarMovies((err,results)=>{
            if(err){
                console.log(err);
                res.status(500).send("Error loading movies.");
                return;
            }
            movie.similar = results;
            movie.save((err,result)=>{
                if(err){
                    console.log(err);
                    res.status(500).send("Error loading movies.");
                    return;
                }
                Movie.populate(movie, {path:"similar", select: "_id title"}, (err, result)=> {  
                    if(err){
                        console.log(err);
                        res.status(500).send("Error loading movies.");
                        return;
                    }
                    count++;
                    if(count==res.movies.length){
                        next();
                        return;
                    } 
                });
            })
        })
    })
}

router.param("mid", (req, res, next, value)=> {
	let oid;
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("Movie ID " + value + " does not exist.");
		return;
	}
	
    Movie.findById(value)
    .populate("directors", "name _id")
    .populate("writers", "name _id")
    .populate("actors", "name _id")
    .populate({
        path: 'reviews',
        populate: { path: 'userID', select: "username _id"},
    })
    .exec((err, result)=> {
		if(err){
			console.log(err);
			res.status(500).send("Error reading movie.");
			return;
		}
		
		if(!result){
			res.status(404).send("Movie ID " + value + " does not exist.");
			return;
		}
		
		req.movie = result;
		next();
	});
});

function queryParser(req, res, next){
	if(!req.query.title) req.query.title = "?";

	if(req.query.genre && req.query.genre.length>=2){
        if(req.query.genre.includes("-") && req.query.genre.length>=5){//for Sci-Fi and Film-Noir
            let strs = req.query.genre.split("-").trim();
            strs = strs.map(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase());
            req.query.genre = strs.join("-");
        }else{
            req.query.genre = req.query.genre.charAt(0).toUpperCase() + req.query.genre.slice(1).toLowerCase();
        }
	}

	try{
		req.query.minrating = req.query.minrating || 0;
		req.query.minrating = Number(req.query.minrating);
	}catch(err){
		req.query.minrating = 0;
	}

	if(req.query.year){
		try{
			req.query.year = Number(req.query.year);
		}catch(err){
			console.log(err);
		}
	}

	if(!req.query.page || req.query.page < 1) req.query.page = 1;
    try{
		req.query.page = Number(req.query.page);
	}catch{
		req.query.page = 1;
	}
	next();
}

function loadMovies(req, res, next){
	const cap = 50;
	let startIndex = (req.query.page-1) * cap; 
	let query = Movie.find()
	.where("averageRating").gte(req.query.minrating)
	.where("title").regex(new RegExp(".*" + req.query.title + ".*", "i"))
	if(req.query.year) query = query.where("releaseYear").equals(req.query.year);
	if(req.query.genre) query = query.where("genre").equals(req.query.genre);
    query = query.populate("directors", "name _id")
    .populate("writers", "name _id")
    .populate("actors", "name _id")
    .populate({
        path: 'reviews',
        populate: { path: 'userID', select: "username _id"},
    })
    .limit(cap).skip(startIndex);
	query.exec((err,results)=>{
		if(err){
			res.status(500).send("Error reading movies.");
			console.log(err);
			return;
        }
        res.movies = results;
		next();
		return;
	});
}

function getMovies(req, res){
	res.format({
		"application/json" : () => {
			res.status(200).json(res.movies);
		},
		"text/html" : () => {
			res.status(200).render("pages/search", {searchResults: res.movies, type:{movies:true}, genre});		
		}
	});
}

function getMovie(req, res){
    let contributor = false;
    if(req.session.username) contributor = req.sessionUser.userType;
    res.format({
		"application/json" : () => {
			res.status(200).json(req.movie);
        },
		"text/html" : () => {
			res.status(200).render("pages/movie", {movie:req.movie, contributor});	
		}
	});
}

function notifyFollowers(req, res, next){
    //notify followers that the user made a review
    let peopleSaved = 0;
    res.people.forEach(person=>{
        let notification
        if(res.ajax){
            notification = person.name + " was added to " + req.movie.title;
        }else{
            notification = person.name + " was added to " + res.createdMovie.title;
        }
        User.updateMany( { peopleFollowing: person._id }, { $push: {inbox: notification}}, (err, results)=>{
            if(err){
                console.log(err);
                res.status(500).send("Server error.");
                return;
            }
            peopleSaved++;
            if(peopleSaved==res.people.length){
                if(res.ajax) {
                    res.status(200).send("/movies/"+req.movie._id);
                }else{
                    res.redirect("/movies/"+res.createdMovie._id);
                }
                return;
            }
        });
    })
}

function createMovie(req, res, next){
	if (req.body.directors && typeof req.body.directors === "string") {
		req.body.directors = req.body.directors.split(",").map(str => str.trim());
	} 
	if (req.body.writers && typeof req.body.writers === "string") {
		req.body.writers = req.body.writers.split(",").map(str => str.trim());
	} 
	if (req.body.actors && typeof req.body.actors === "string") {
		req.body.actors = req.body.actors.split(",").map(str => str.trim());
    } 
    if(!req.body.directors || req.body.directors.length===0 || !req.body.writers || req.body.writers.length===0 || !req.body.actors || req.body.actors.length===0){
        res.status(500).send("Error creating movie: There must be at least 1 actor, 1 director, and 1 writer");
        return;
    }

    let m = new Movie();
    if (req.body.title) m.title = req.body.title;
    if (req.body.releaseYear) m.releaseYear = req.body.releaseYear;
    if (req.body.rated) m.rated = req.body.rated;
    if (req.body.released) m.released = req.body.released;
    if (req.body.runtime) m.runtime = req.body.runtime;
    if (req.body.plot) m.plot = req.body.plot;
    if (req.body.language) m.language = req.body.language;
    if (req.body.country) m.country = req.body.country;
    if (req.body.awards) m.awards = req.body.awards;
    if (req.body.poster) m.poster = req.body.poster;
    if (req.body.genre) m.genre = req.body.genre;
    
    let people = {};
    let directorIDs = [];
    let writerIDs = [];
    let actorIDs = [];
    let numD = 0, numW = 0, numA = 0;
    
    req.body.directors.forEach(pName=> {
        Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
            if(err){
                res.status(500).send("Error reading people data.");
                console.log(err);
                return;
            }
            if(!result){
                if(people.hasOwnProperty(pName) && !containsID(directorIDs, people[pName]._id)){
                    people[pName].directed.push(m._id);
                    directorIDs.push(people[pName]._id);
                }else{
                    let p = new Person();
                    p.name = pName;
                    p.directed = [m._id];
                    p.written = [];
                    p.acted = [];
                    directorIDs.push(p._id);
                    people[pName] = p;
                }
            } else{
                if (!containsID(directorIDs, result._id)){
                    result.directed.push(m._id);
                    directorIDs.push(result._id);
                    if (!people[pName]) people[pName] = result;
                }
            }
            numD++;
            if(numD >=req.body.directors.length){
                m.directors = directorIDs;
                if (numW >=req.body.writers.length && numA >=req.body.actors.length){
                    m.save((err, result)=> {
                        if(err){
                            console.log(err);
                            res.status(500).send(err.message);
                            return;
                        }
                        let peopleArr = []
                        for(personName in people){
                            peopleArr.push(people[personName]);
                        }
                        let numP = 0;
                        peopleArr.forEach(person=>{
                            person.save(function(err,result){
                                if(err){
                                    console.log(err);
                                    res.status(500).send(err.message);
                                    return;
                                }
                                numP++;
                                if(numP >= peopleArr.length){
                                    res.people = peopleArr;
                                    res.createdMovie = m;
                                    next();
                                    return;
                                }
                            })
                        });
                    });
                }
            }
        });
    });

    req.body.writers.forEach(pName=> {
        Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
            if(err){
                res.status(500).send("Error reading people data.");
                console.log(err);
                return;
            }
            if(!result){
                if(people.hasOwnProperty(pName)  && !containsID(writerIDs, people[pName]._id)){
                    people[pName].written.push(m._id);
                    writerIDs.push(people[pName]._id);
                }else{
                    let p = new Person();
                    p.name = pName;
                    p.directed = [];
                    p.written = [m._id];
                    p.acted = [];
                    writerIDs.push(p._id);
                    people[pName] = p;
                }
            } else{
                if (!containsID(writerIDs, result._id)){
                    result.written.push(m._id);
                    writerIDs.push(result._id);
                    if (!people[pName]) people[pName] = result;
                }
            }
            numW++;
            if(numW >=req.body.writers.length) {
                m.writers = writerIDs;
                if (numD >=req.body.directors.length && numA >=req.body.actors.length){
                    m.save((err, result)=> {
                        if(err){
                            console.log(err)
                            res.status(500).send(err.message);
                            return;
                        }
                        let peopleArr = []
                        for(personName in people){
                            peopleArr.push(people[personName]);
                        }
                        let numP = 0;
                        peopleArr.forEach(person=>{
                            person.save(function(err,result){
                                if(err){
                                    console.log(err);
                                    res.status(500).send(err.message);
                                    return;
                                }
                                numP++;
                                if(numP >= peopleArr.length){
                                    res.people = peopleArr;
                                    res.createdMovie = m;
                                    next();
                                    return;
                                }
                            })
                        });
                    });
                }
            }
        });
    });

    req.body.actors.forEach(pName=> {
        Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
            if(err){
                res.status(500).send("Error reading people data.");
                console.log(err);
                return;
            }
            if(!result){
                if(people.hasOwnProperty(pName)  && !containsID(actorIDs, people[pName]._id)){
                    people[pName].acted.push(m._id);
                    actorIDs.push(people[pName]._id);
                }else{
                    let p = new Person();
                    p.name = pName;
                    p.directed = [];
                    p.written = [];
                    p.acted = [m._id];
                    actorIDs.push(p._id);
                    people[pName] = p;
                }
            } else{
                if (!containsID(actorIDs, result._id)){
                    result.acted.push(m._id);
                    actorIDs.push(result._id);
                    if (!people[pName]) people[pName] = result;
                }
            }
            numA++;
            if(numA >=req.body.actors.length){
                m.actors = actorIDs;
                if (numD >=req.body.directors.length && numW >=req.body.writers.length){
                    m.save((err, result)=> {
                        if(err){
                            console.log(err);
                            res.status(500).send(err.message);
                            return;
                        }
                        let peopleArr = []
                        for(personName in people){
                            peopleArr.push(people[personName]);
                        }
                        let numP = 0;
                        peopleArr.forEach(person=>{
                            person.save(function(err,result){
                                if(err){
                                    console.log(err);
                                    res.status(500).send(err.message);
                                    return;
                                }
                                numP++;
                                if(numP >= peopleArr.length){
                                    res.people = peopleArr;
                                    res.createdMovie = m;
                                    next();
                                    return;
                                }
                            })
                        });
                    });
                }
            }
        });
    });
}


function auth(req, res, next) {
    if(!req.session.loggedin) {
        res.redirect("/");
        return;
	}
    next();
}

function saveMovie(req,res,next){
    req.movie.save((err, result)=> {
        if(err){
            console.log(err);
            res.status(500).send("Error updating movie.");
            return;
        }
        let numP=0;
        res.people.forEach(person=>{
            person.save(function(err,result){
                if(err){
                    console.log(err);
                    res.status(500).send(err.message);
                    return;
                }
                numP++;
                if(numP >= res.people.length){
                    res.ajax=true;
                    next();
                    return;
                }
            })
        });
    });
}

function editMovie(req, res, next){
    if(!req.body.directors && !req.body.writers && !req.body.actors){
        res.status(500).send("Server error.");
        return;
    }
    if (req.body.directors && typeof req.body.directors === "string") {
		req.body.directors = req.body.directors.split(",").map(str => str.trim());
	} 
	if (req.body.writers && typeof req.body.writers === "string") {
		req.body.writers = req.body.writers.split(",").map(str => str.trim());
	} 
	if (req.body.actors && typeof req.body.actors === "string") {
		req.body.actors = req.body.actors.split(",").map(str => str.trim());
    } 
    let people = [];
    let numPeople = 0;
    if(req.body.actors) {
        req.body.actors.forEach(pName => {
            Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
                if(err){
                    console.log(err);
                    res.status(500).send("Error creating person.");
                    return;
                }
                if(result && !people[pName] && !containsID(req.movie.actors, result._id)){
                    result.acted.push(req.movie._id);
                    req.movie.actors.push(result._id);
                    people[pName] = result;
                }
                numPeople++;
                if(numPeople==req.body.actors.length){
                    let peopleArr = []
                    for(personName in people){
                        peopleArr.push(people[personName]);
                    }
                    res.people = peopleArr;
                    next();
                }
            });
        });
    } else if(req.body.writers) {
        req.body.writers.forEach(pName => {
            Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
                if(err){
                    console.log(err);
                    res.status(500).send("Error creating person.");
                    return;
                }
                if(result && !people[pName] && !containsID(req.movie.writers, result._id)){
                    result.written.push(req.movie._id);
                    req.movie.writers.push(result._id);
                    people[pName] = result;
                }
                numPeople++;
                if(numPeople==req.body.writers.length){
                    let peopleArr = []
                    for(personName in people){
                        peopleArr.push(people[personName]);
                    }
                    res.people = peopleArr;
                    next();
                }
            });
        });
    } else if(req.body.directors) {
        req.body.directors.forEach(pName => {
            Person.findOne().where("name").regex(new RegExp('^'+ pName + '$', "i")).exec((err,result)=>{
                if(err){
                    console.log(err);
                    res.status(500).send("Error creating person.");
                    return;
                }
                if(result && !people[pName] && !containsID(req.movie.directors, result._id)){
                    result.directed.push(req.movie._id);
                    req.movie.directors.push(result._id);
                    people[pName] = result;
                }
                numPeople++;
                if(numPeople==req.body.directors.length){
                    let peopleArr = []
                    for(personName in people){
                        peopleArr.push(people[personName]);
                    }
                    res.people = peopleArr;
                    next();
                }
            });
        });
    }
}

function containsID(arr,id){
    let contains = false;
    arr.forEach(elem => {
        if(elem._id.equals(id)) {
            contains = true;
        }
    });
    return contains;
}

module.exports = router;











