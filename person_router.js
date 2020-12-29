const mongoose = require('mongoose');
const express = require('express');
let genre = require("./genre.json");
const ObjectId = require('mongoose').Types.ObjectId
let Movie = require("./movie_model");
let Person = require("./person_model");
let User = require("./user_model");
let router = express.Router();

router.post("/", auth, createPerson);
router.get("/", queryParser, loadPeople, getPeople);
router.get("/:pid", loadSessionUser, loadFreqCollabs, updateFreqCollabs, getPerson);
router.put("/:pid", auth, loadSessionUser, changeFollowPerson);

function createPerson(req, res){
	Person.findOne().where("name").regex(new RegExp('^'+ req.body.name + '$', "i")).exec((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Error creating person.");
			return;
		}
		if(result){
			res.status(500).send("Person with that name already exists.");
			return;
		}
		let p = new Person();
		if (req.body.name) p.name = req.body.name;
		if (req.body.bio) p.bio = req.body.bio;
		p.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send(err.message);
				return;
			}
			res.redirect("/people/"+result._id);
		})
	});
}

function updateFreqCollabs(req,res,next){
	req.person.save((err,result)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");
			return;
		}
		Person.populate(req.person, {path:"freqCollabs", select: "_id name"}, (err, result)=> {  
			if(err){
				console.log(err);
				res.status(500).send("Server error.");
				return;
			}
			next();
		})
	})
}

function loadFreqCollabs(req,res,next){
	req.person.findMoviesWorked((err,results)=>{
		if(err){
			console.log(err);
			res.status(500).send("Server error.");
			return;
		}
		let cap = 5;
		let allCollabs = [];
		results.forEach(movie => {
			let collabsForMovie = [];
			movie.directors.forEach(person => {
				if(!collabsForMovie.includes(person) && !person.equals(req.person._id)){
					collabsForMovie.push(person);
				}
			});
			movie.writers.forEach(person => {
				if(!collabsForMovie.includes(person) && !person.equals(req.person._id)){
					collabsForMovie.push(person);
				}
			});
			movie.actors.forEach(person => {
				if(!collabsForMovie.includes(person) && !person.equals(req.person._id)){
					collabsForMovie.push(person);
				}
			});
			allCollabs = allCollabs.concat(collabsForMovie);
		});
		req.person.freqCollabs = xMostFrequent(allCollabs, cap);
		next();
	})
}

function xMostFrequent(L, x){
    freqs = {}
    L.forEach(i => {
        if(!freqs.hasOwnProperty(i)) freqs[i] = 0;
        freqs[i] += 1;
    });

    mostFreqs = [];
    for(let i=0;i<x;i++){
        maxFreq = 0;
        mostFreq = "";
        for (let person in freqs) {
            if (freqs.hasOwnProperty(person)) {
                if(freqs[person] > maxFreq && !mostFreqs.includes(person)){
                    maxFreq = freqs[person];
                    mostFreq = person;
                }   
            }
        }
        if(mostFreq){//making sure mostFreq isn't undefined (for case where #people less than cap)
            mostFreqs.push(mostFreq);
        }
    }
    return mostFreqs;
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

function changeFollowPerson(req, res){
	let type = req.body.type;
	let person = req.person;
	let result = req.sessionUser;

	if(type && !person.followers.includes(result._id)){
		result.peopleFollowing.push(person._id);
		person.followers.push(result._id);
		let numSaved = 0;
		result.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			numSaved++;
			if(numSaved==2){
				res.status(200).send({type:true});
				return;
			}
		});
		person.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating person data.");
				return;
			}
			numSaved++;
			if(numSaved==2){
				res.status(200).send({type:true});
				return;
			}
		});
	}else if(!type && person.followers.includes(result._id)){
		result.peopleFollowing = result.peopleFollowing.filter(personID => { return !personID.equals(person._id)});
		person.followers = person.followers.filter(followerID => { return !followerID.equals(result._id)});
		let numSaved = 0;
		result.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			numSaved++;
			if(numSaved==2){
				res.status(200).send({type:false});
				return;
			}
		});
		person.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating person data.");
				return;
			}
			numSaved++;
			if(numSaved==2){
				res.status(200).send({type:false});
				return;
			}
		});
	}else{
		res.status(500).send("server error");
		return;
	}
}

router.param("pid", (req, res, next, value)=> {
	let oid;
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("Person ID " + value + " does not exist.");
		return;
	}
	
	Person.findById(value) 
	.populate("directed", "_id title")
	.populate("written", "_id title")
	.populate("acted", "_id title")
	.exec((err, result)=> {
		if(err){
			console.log(err);
			res.status(500).send("Error reading person data.");
			return;
		}
		
		if(!result){
			res.status(404).send("Person ID " + value + " does not exist.");
			return;
		}
		
		req.person = result;
		next();
	});
});

function queryParser(req, res, next){
	if(!req.query.name) req.query.name = "?";

	if(!req.query.page || req.query.page < 1) req.query.page = 1;
    try{
		req.query.page = Number(req.query.page);
	}catch{
		req.query.page = 1;
	}
	next();
}

function loadPeople(req, res, next){
	const cap = 50;
	let startIndex = (req.query.page-1) * cap; 
	Person.find()
	.where("name").regex(new RegExp(".*" + req.query.name + ".*", "i"))
	.populate("directed", "_id title")
	.populate("written", "_id title")
	.populate("acted", "_id title")
	.limit(cap).skip(startIndex)
	.exec((err,results)=>{
		if(err){
			res.status(500).send("Error reading people data.");
			console.log(err);
			return;
        }
		res.people = results;
		next();
		return;
	});
}

function getPerson(req, res) {
	res.format({
		"application/json" : () => {
			res.status(200).json(req.person);
		},
		"text/html" : () => {

			//let collabs = model.getFreqCollabs(pID);
			let following = req.person.followers.includes(req.sessionUser._id);
			res.status(200).render("pages/person", {person:req.person, following}); 
		}
	});
}

function getPeople(req, res){
	res.format({
		"application/json" : () => {
			res.status(200).json(res.people);
		},
		"text/html" : () => {
			res.status(200).render("pages/search", {searchResults: res.people, type:{people:true}, genre});		
		}
	});
}

function auth(req, res, next) {
    if(!req.session.loggedin) {
        res.redirect("/");
        return;
	}
    next();
}

module.exports = router;