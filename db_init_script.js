const mongoose = require("mongoose");
const Movie = require("./movie_model");
const Person = require("./person_model");
const User = require("./user_model");

let movieData = require("./movieData2.json");
let peopleData = require("./peopleData.json");

let moviesObj = {};
let peopleObj = {};
console.log("Creating initial movie, person, and user documents (this might take a while)...");
for(movieID in movieData){
    let movie = movieData[movieID];
    let m = new Movie();
    m.title = movie.title;
    try{
        m.releaseYear = Number(movie.releaseYear);
    }catch{
        m.releaseYear = 1995;
    }
    m.rated = movie.rated;
    m.released = movie.released;
    try{
        m.runtime = Number(movie.runtime.split(' ')[0]);
    }catch{
        m.runtime = 90;
    }
    m.genre = movie.genre;
    m.plot = movie.plot;
    m.language = movie.language;
    m.country = movie.country;
    m.awards = movie.awards;
    m.poster = movie.poster;
    m.directors = [];
    movie.directors.forEach(pID => {
        pName = peopleData[pID].name;
        if(!peopleObj.hasOwnProperty(pName)) {
            let result = new Person();
            result.name = pName;
            result.directed = [];
            result.written = [];
            result.acted = [];
            result.freqCollabs = [];
            result.followers = [];
            result.bio = "This is the person's bio..."
            peopleObj[pName] = result;
        }
        peopleObj[pName].directed.push(m._id);
        m.directors.push(peopleObj[pName]._id);
    });
    m.writers = [];
    movie.writers.forEach(pID => {
        pName = peopleData[pID].name;
        if(!peopleObj.hasOwnProperty(pName)) {
            let result = new Person();
            result.name = pName;
            result.directed = [];
            result.written = [];
            result.acted = [];
            result.freqCollabs = [];
            result.followers = [];
            result.bio = "This is the person's bio..."
            peopleObj[pName] = result;
        }
        peopleObj[pName].written.push(m._id);
        m.writers.push(peopleObj[pName]._id);
    });
    movie.actors.forEach(pID => {
        pName = peopleData[pID].name;
        if(!peopleObj.hasOwnProperty(pName)) {
            let result = new Person();
            result.name = pName;
            result.directed = [];
            result.written = [];
            result.acted = [];
            result.freqCollabs = [];
            result.followers = [];
            result.bio = "This is the person's bio..."
            peopleObj[pName] = result;
        }
        peopleObj[pName].acted.push(m._id);
        m.actors.push(peopleObj[pName]._id);
    });
    moviesObj[m._id] = m;
}

let safwan = new User({username:"Safwan", password:"123", userType: true, pic:'https://cdn.mos.cms.futurecdn.net/ht9Ne9WAubRxeypYdGnCSk.jpg'});
let wadud = new User({username:"Wadud", password:"456"});

console.log("creation complete.");

mongoose.connect('mongodb://localhost/moviedb', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected to moviedb database");
	mongoose.connection.db.dropDatabase(function(err, result){
		if(err){
			console.log("Error dropping database:");
			console.log(err);
			return;
		}
        console.log("Dropped database.\nSaving previously created documents to new database...");
        
        let completedMovies = 0;
        let completedPeople = 0;
        let completedUsers = 0;
        
        let moviesArr = []
        for(mID in moviesObj){
            moviesArr.push(moviesObj[mID]);
        }
		moviesArr.forEach(movie => {
			movie.save(function(err,result){
				completedMovies++;
				if(completedMovies >= moviesArr.length){
                    console.log("All movies saved.");
                    if(completedMovies >= moviesArr.length && completedPeople >= peopleArr.length && completedUsers>=2) {
                        console.log("Initialization comlete.");
                        mongoose.connection.close();
                    }
				}
			})
		});
        
        let peopleArr = []
        for(pName in peopleObj){
            peopleArr.push(peopleObj[pName]);
        }
		peopleArr.forEach(person => {
			person.save(function(err,result){
				completedPeople++;
				if(completedPeople >= peopleArr.length){
                    console.log("All people saved.");
                    if(completedMovies >= moviesArr.length && completedPeople >= peopleArr.length && completedUsers>=2) {
                        console.log("Initialization comlete.");
                        mongoose.connection.close();
                    }
				}
			})
        });

        safwan.save(function(err){
            if(err) {
                console.log(err);
            }
            console.log("Saved safwan.");
            completedUsers++;
            wadud.save(function(err){
                if(err) throw err;
                console.log("Saved wadud.");
                completedUsers++;
                console.log("All users saved.");
                if(completedMovies >= moviesArr.length && completedPeople >= peopleArr.length && completedUsers>=2) {
                    console.log("Initialization comlete.");
                    mongoose.connection.close();
                }
            });
        });

	});
});