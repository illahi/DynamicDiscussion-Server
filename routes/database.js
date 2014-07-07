// Database

var thread 		= require('./thread');
var reply		= require('./reply');

var db_name		= 'Application1';
var col_name	= 'posts';

var mongo 		= require('mongodb');
var Server 		= mongo.Server
var Db 			= mongo.Db
var BSON 		= mongo.BSONPure;
var server 		= new Server('localhost', 27017, {auto_reconnect: true});

// MongoDB - NodeJS interface for use with 
// DynamicDiscussion server by Illahi Khan
db = new Db(db_name, server, {w:1});

db.open(function(err, db) {

	if (!err) {
		console.log("Connected to the '" + db_name + "' database.");
		initCollections();
	}
	else {
		console.log("Could not connect to the '" + name + "' database.");
	}

});

var initCollections = function () {

	try {
		db.collection('posts', function (err, collection) {
			// Find last active threads and add them to the active thread list.
			collection.find({ type : "thread" }).sort({last:-1}).limit(thread.max).toArray(
				function(err, items) {
					for (var i = 0; i < items.length; i++) {
						thread.threads.push(items[i]);
						thread.hash[items[i]._id] = items[i];
					}
					console.log("\t'" + col_name + "' collection : initialized");
					console.log("\t\tActive threads in memory.");
				}
			);
			// Find their associated posts and add them to the hash.
			collection.find({ type : "reply" }).sort({date:-1}).limit(reply.max).toArray(
				function(err, items) {
					for (var i = 0; i < items.length; i++) {
						thread.hash[items[i]._id] = items[i];
					}
					console.log("\t\tActive replies in memory.");
				}
			);
		});
	}
	catch (e) {
		console.log("\t'" + col_name + "' collection : initialization failure :" + e);
	}

}

exports.insertPost = function (post) {

	try {
		db.collection('posts', function (err, collection) {
			collection.insert(post, {safe:true}, function (err, result) {
				if (!err) {
					console.log("Inserted the new " + result[0].type + " (with _id = " + result[0]._id + ") into the 'posts' collection.");
				}
				else {
					console.log("Error : In 'collection.insert' in 'insertPost()' in 'database.js'.");
					throw err;
				}
			});
		});
	}
	catch (err) {
		console.log(err);
		throw err;
	}

};

exports.findPost = function (post, type, fn) {
	post = post.toString();
	try {
		db.collection('posts', function (err, collection) {
			collection.findOne({'_id':new BSON.ObjectID(post)}, function (err, result) {
				if (!err) {
					console.log(JSON.stringify(result));
					if (result.type == type) {
						fn(result);
					}
					else {
						console.log("Error : In 'collection.findOne' in 'findPost()' in 'database.js'.");
						throw "Could not find a " + type + " with id = " + post + ".";
					}
				}
				else {
					console.log("Error : In 'collection.findOne' in 'findPost()' in 'database.js'.");
					throw err;
				}
			});
		});
	}
	catch (err) {
		console.log("lol" + err);
		throw err;
	}

};

// Update a post with new children and an updated date.
exports.updatePost = function (parent, child, new_date) {

	try {
		db.collection('posts', function (err, collection) {
			collection.update({'_id':new BSON.ObjectID(parent)}, {$push: {children: child}, $set: {date: new_date}}, {safe:true}, function (err, result) {
				if (!err) {
					console.log("The parent post has updated.");
				}
				else {
					console.log("Error : In 'collection.update' in 'updatePost()' in 'database.js'.");
					throw err;
				}
			});
		});
	}
	catch (err) {
		console.log(err);
		throw err;
	}

};

// Update thread date.
exports.updateThread = function (id, date) {

	id = id.toString();
	
	try {
		db.collection('posts', function (err, collection) {
			collection.update({'_id':new BSON.ObjectID(id)}, {$set: {last: date}}, {safe:true}, function (err, result) {
				if (!err) {
					console.log("The thread's 'last updated' variable has updated.");
				}
				else {
					console.log("Error : In 'collection.update' in 'updatePost()' in 'database.js'.");
					throw err;
				}
			});
		});
	}
	catch (err) {
		console.log(err);
		throw err;
	}

}