// Illahi Khan 2014

// Module dependencies
var express 	= require('express');
var routes 		= require('./routes');
var user 		= require('./routes/user');
var thread  	= require('./routes/thread');
var reply 		= require('./routes/reply');
var http 		= require('http');
var path 		= require('path');

// For app
var app 		= express();

// For socket.io
var server 		= http.createServer(app);
var io 			= require('socket.io').listen(server);

// All environments
io.set('log level', 1); // reduce the logging information
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routing
app.get('/', routes.index);

// Recent information 
// TODO : Put in REDIS

// Socket communication
io.sockets.on('connection', function (socket) {

	// Listen for a client to emit new user information
	// Then add the user to the user list and emits new user list
	socket.on('newUser', function(username){
		var date 		= new Date();
		socket.username = username;
		user.add(username);
		socket.emit('connectionConfirmed', user.list(), thread.list(0, 10));
		socket.broadcast.emit('connectionChange', username, date, 1);
	});

	// Listen for a client to emit new thread information
	// Then add the thread to active thread list and emit the new thread
	socket.on('newThread', function (title, data, staging_number) {
		var date 				= new Date();
		threadObject 			= new Object();
		threadObject.username 	= socket.username;
		threadObject.date 		= date;
		threadObject.last		= date;
		threadObject.title 		= title;
		threadObject.message 	= data;
		threadObject.children	= [];
		threadObject.type		= "thread";
		threadObject.origin 	= null;
		try {
			// Add the new thread to the database.
			thread.create(threadObject);
			// TODO : emit stored object, not received object - to ensure it was saved
			socket.broadcast.emit('appendThread', threadObject);
			socket.emit('threadStatus', threadObject._id, "success", staging_number);
		}
		catch (err) {
			// Emit event to indicate that their request for a new thread failed.
			socket.emit('threadStatus', 0, "fail", staging_number);
			console.log("Error : Could not create the new thread.");
		}
	});

	// Listen for a client to emit new reply information
	// Then add the reply, update the parent, and emit the new reply
	socket.on('newReply', function (data, parent, staging_number) {
		var date 				= new Date();
		replyObject 			= new Object();
		replyObject.username 	= socket.username;
		replyObject.date 		= date;
		replyObject.message 	= data;
		replyObject.children	= [];
		replyObject.type		= "reply";
		replyObject.parent		= parent;
		replyObject.origin		= null;
		try {
			// Add the new post to the database.
			reply.create(replyObject, parent);
			// TODO : emit stored object, not received object - to ensure it was saved
			// TODO : emit an event to indicate a thread has updated - move it up the top
			// TODO : when a reply is created move thread to top of active thread list
			// TODO : FInd out - thread is not put at top of list after server reset despite time sorting?
			socket.broadcast.emit('appendReply', replyObject);
			socket.emit('replyStatus', replyObject._id, "success", staging_number);

		}
		catch (err) {
			// Emit event to requester to indicate that their request for a new thread failed.
			socket.emit('replyStatus', 0, "fail", staging_number);
			console.log("Error : Could not create the new reply.");
			console.log(err);
		}
	});

	// Listen for a client to emit new message information
	// Then emit new chat information
	socket.on('newMessage', function (data) {
		var date = new Date();
		io.sockets.emit('updateChat', socket.username, data, date);
		// TODO : save messages to databases
	});

	// Listen for a client to emit a request for a thread tree
	// Then deliver that thread tree
	socket.on('threadRequest', function (id) {	
		try {
			collection = thread.findTree(id);
			socket.emit('requestedThread', collection);
		}
		catch (err) {
			socket.emit('threadRequestFailure');
			console.log(err);
		}
	});

	// Listen for a client to emit disconnect information
	// Then delete that user from the user list and emit new user list
	socket.on('disconnect', function () {
		var date = new Date();
		user.remove(socket.username);
		socket.broadcast.emit('connectionChange', socket.username, date, 0);
	});

});

// Server initialization
server.listen(app.get('port'), function(){
	console.log('Server listening on port ' + app.get('port') + '.');
});