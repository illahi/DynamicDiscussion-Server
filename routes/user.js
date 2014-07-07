// User Controller

var users = {};

// List all users
exports.list = function () {
	return users;
};

// Add user
exports.add = function (username) {
	users[username] = username;
};

// Remove user
exports.remove = function (username) {
	delete users[username];
};