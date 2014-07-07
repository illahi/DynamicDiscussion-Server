// Thread Controller
// By Illahi Khan

var database  	= require('./database');
var reply		= require('./reply');
var max			= 1000;
var threads		= []; // "active thread list" - in order collection of threads
var hash		= {}; // threads and replies that are kept in memory
var tree		= {}; // entire tree structures for corresponding threads
exports.max 	= max;
exports.threads	= threads;
exports.hash	= hash;
exports.tree	= tree;

// List the threads from position x to position y, where x is newer (closer to the end) than y.
exports.list = function (x, y) {

	// TODO: Search in database?.
	if (x < 0 || y < 0 || (y - x) < 0 || x > threads.length) {
		throw "Error : Improper parameters."
	}

	if (y > threads.length) {
		y = threads.length;
	}

	var list = threads.slice(x, y);

	return list;

};

// Create a new thread.
exports.create = function (thread) {

	// Insert the thread into the database.
	try {
		database.insertPost(thread);
	}
	catch (err) {
		console.log("Inserting a new thread into the database failed.")
		throw err;
	}

	// Update the active thread list by inserting this thread on top and into the key-value store.
	try {
		if (threads.length >= max) {
			threads.pop();
			threads.unshift(thread); // The newest thread is at the beginning.
			hash[thread._id] = thread;
		}
		else {
			threads.unshift(thread);
			hash[thread._id] = thread;
		}
		exports.threads = threads;
		exports.hash = hash;
		console.log("Added the new thread to the active thread list.");	
	}
	catch (err) {
		console.log("Error : In 'create()' in 'thread.js'.");
		console.log(err);
		throw err;
	}

	// Construct a new empty tree for this new thread.
	try {
		this.findTree(thread._id);
	}
	catch (err) {
		console.log("Error: Cannot create new thread's tree. " + err);
		throw err;
	}

};

// Find a particular thread.
exports.find = function (id) {

	// Try to find the thread in memory.
	if (hash[id] !== undefined) {
		if (hash[id].type == 'thread') {
			return hash[id];
		}
		else {
			console.log("Error : In 'find()' in 'thread.js'.");
			throw "The requested post is not a thread.";
		}
	}

	// Try to find the thread in the database.
	// Should not be called. Not working properly because of improper callback procedure.
	try {
		var callback = function (result) {
			console.log("Found in database : \n" + result);
		}
		database.findPost(id, "thread", callback);
	}
	catch (err) {
		console.log("Finding the thread in the database failed.");
		throw err;
	}

};

// Find the tree for a particular thread either from memory or via depth first search.
exports.findTree = function (id) {

	// Try to find the tree in memory. 
	if (tree[id] !== undefined) {
		return tree[id];
	}

	// Construct the tree via depth first search.
	var stack 	= [];
	var result 	= [];

	try {
		stack.push(this.find(id));
	}
	catch (err) {
		console.log("memory check - findTree()");
		throw err;
	}

	while (stack.length != 0) {
		var current = stack[stack.length - 1];
		result.push(stack.pop());
		for (var i = 0; i < current.children.length; i++) {
			try {
				stack.push(reply.find(current.children[i]));
			}
			catch (err) {
				console.log("database check - findTree()");
				throw err;
			}
		}
	}

	tree[id] = result;
	return result;

};

exports.recalculateTree = function (origin, parent, reply) {

	//console.log(origin + " " + parent + " " + reply);
	// Construct the tree via depth first search.
	console.log("origin" + origin);
	var current = tree[origin];
	console.log("current " + current);
	
	//console.log(current);
    var index = -1;
	for (var i = 0; i < current.length; i++) {
		if (current[i]._id == parent) {
			index = i;
			break;
		}
	}

	if (index == -1) {
		throw "Not found.";
	}

	current.splice(index + 1, 0, reply);
	tree[origin] = current;

};

// Find the position of a thread in the active thread list.
exports.findPosition = function (id) {
	for(var i = 0; i < threads.length; i++) {
		if (threads[i]._id == id) {
			return i;
		}
	}

	return -1;

};