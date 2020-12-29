const mongoose = require('mongoose');
const express = require('express');
let genre = require("./genre.json");
const ObjectId = require('mongoose').Types.ObjectId
const ObjectIDs = require("mongodb").ObjectID
let Movie = require("./movie_model");
let User = require("./user_model");
let router = express.Router();

router.get("/", queryParser, loadUsers, getUsers);
router.get("/:uid", loadSessionUser, getUser);
router.put("/:uid", auth, loadSessionUser, changeFollowUser)

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

function changeFollowUser(req, res){
	let type = req.body.type;
	let otherUser = req.user;
	let result = req.sessionUser;
	if(type && !otherUser.followers.includes(result._id)){
		result.usersFollowing.push(otherUser._id);
		otherUser.followers.push(result._id);
		let usersSaved = 0;
		result.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			usersSaved++;
			if(usersSaved==2){
				res.status(200).send({type:true});
				return;
			}
		});
		otherUser.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			usersSaved++;
			if(usersSaved==2){
				res.status(200).send({type:true});
				return;
			}
		});
	}else if(!type && otherUser.followers.includes(result._id)){
		result.usersFollowing = result.usersFollowing.filter(userFollowingID => {return !userFollowingID.equals(otherUser._id);});
		otherUser.followers = otherUser.followers.filter(followerID => {return !followerID.equals(result._id)});
		let usersSaved = 0;
		result.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			usersSaved++;
			if(usersSaved==2){
				res.status(200).send({type:false});
				return;
			}
		});
		otherUser.save((err,result)=>{
			if(err){
				console.log(err);
				res.status(500).send("Error updating user data.");
				return;
			}
			usersSaved++;
			if(usersSaved==2){
				res.status(200).send({type:false});
				return;
			}
		});
	}else{
		res.status(500).send("server error");
		return;
	}
}

router.param("uid", (req, res, next, value)=> {
	let oid;
	try{
		oid = new ObjectId(value);
	}catch(err){
		res.status(404).send("User ID " + value + " does not exist.");
		return;
	}
	
	User.findById(value)
	.select("-password")
	.populate("peopleFollowing", "_id name")
	.populate("usersFollowing", "_id username")
	.populate({
        path: 'reviews',
        populate: { path: 'movieID', select: "title poster _id"},
	})
	.exec((err, result)=> {
		if(err){
			console.log(err);
			res.status(500).send("Error reading user data.");
			return;
		}
		
		if(!result){
			res.status(404).send("User ID " + value + " does not exist.");
			return;
		}
		
		req.user = result;
		next();
	});
});

function getUser(req, res) {
    if (req.session.username===req.user.username){
		res.redirect("/profile");
	}else{
		res.format({
			"application/json" : () => {
				res.status(200).json(req.user);
			},
			"text/html" : () => {
				let following = req.user.followers.includes(req.sessionUser._id);
				res.status(200).render("pages/user", {user:req.user, following}); 
			}
		});
	}
}

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

function loadUsers(req, res, next){
	const cap = 50;
	let startIndex = (req.query.page-1) * cap; 
	User.find()
	.where("username").regex(new RegExp(".*" + req.query.name + ".*", "i"))
	.limit(cap).skip(startIndex)
	.select("-password")
	.populate("peopleFollowing", "_id name")
	.populate("usersFollowing", "_id username")
	.populate({
        path: 'reviews',
        populate: { path: 'movieID', select: "title _id"},
	})
	.exec((err,results)=>{
		if(err){
			res.status(500).send("Error reading users data.");
			console.log(err);
			return;
        }
		res.users = results;
		next();
		return;
	});
}

function getUsers(req, res){
	res.format({
		"application/json" : () => {
			res.status(200).json(res.users);
		},
		"text/html" : () => {
			res.status(200).render("pages/search", {searchResults:res.users, type:{users:true}, genre});		
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