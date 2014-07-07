// Post Controller
// By Illahi Khan

var database 	= require('./database');
var thread 		= require('./thread');
var max			= 1000000;
exports.max		= max;

// Create a new post. "A reply to a post."
exports.create = function (reply, parent) {

	// Find the parent's origin.
	try {
		if (thread.hash[parent].origin == null) {
			reply.origin = thread.hash[parent]._id;
		}
		else {
			reply.origin = thread.hash[parent].origin;
		}
	}
	catch (err) {
		console.log("3001 : Inserting a new reply into the hash failed.");
		throw err;
	}
	// TODO : Find in database if failed above.

	// Insert the reply into the database.
	try {
		database.insertPost(reply);
	}
	catch (err) {
		console.log("3002 : Inserting a new reply into the database failed.");
		throw err;
	}

	// Update the thread's 'last updated' date.
	try {
		//console.log(reply.origin);
		database.updateThread(reply.origin, reply.date);
	}
	catch (err) {
		console.log("3003 : Updating the thread's update date failed.");
		throw err;
	}

	// Put the new reply into the hash.
	// TODO : Collision detection (though unlikely).
	thread.hash[reply._id] = reply;

	// Update the parent post in the hash if found.
	// TODO: Better persistance store method. Put parent post in hash if not found.
	if (thread.hash[parent] !== undefined) {
		thread.hash[parent].children.push(reply._id);
		thread.hash[parent].date = reply.date;
	}

	// TODO: Handle replies with no parent.
	// Update the parent post in the database by appending the reply's _id to the parent post's children list.
	try {
		database.updatePost(parent, reply._id, reply.date);
	}
	catch (err) {
		console.log("3004 : Updating the parent reply in the database failed.");
		throw err;
	}

	// Update the thread tree.
	try {
		thread.recalculateTree(reply.origin, parent, reply);
	}
	catch (err) {
		console.log("3005 : " + err);
		throw err;
	}

	// Update the active thread list by moving the associated thread to the top.
	try {
		var index = thread.findPosition(reply.origin);
		if (index == -1) {
			// Thread not found in active thread list.
			throw "3006 : Error : Thread not found in active thread list. Cannot move the thread to the top."
		}
		else {
			var temp_thread = thread.threads[index];
			thread.threads.splice(index, 1);
			thread.threads.unshift(temp_thread);
		}
	}
	catch (err) {
		console.log("3007 : " + err);
		throw err;
	}


};

// Find a particular reply.
exports.find = function (id) {

	// Try to find the reply in memory.
	if (thread.hash[id] !== undefined) {
		if (thread.hash[id].type == 'reply') {
			return thread.hash[id];
		}
		else {
			console.log("Error : In 'find()' in 'reply.js'.");
			throw "The requested post is not a reply.";		
		}
	}

	// Try to find the reply in the database.
	try {
		database.findPost(id, "thread", function (result) {
			console.log("Found in database : \n" + result);
		});
	}
	catch (err) {
		console.log("Finding the reply in the database failed.");
		throw err;
	}

};
