Dynamic Discussion Server
===========

Hello! This is a server that handles messages sent from a Dynamic Discussion client. Messages that are sent from a client are stored in a tree-like structure, cached accordingly, and sent to every other client which has that 'thread' open. All-in-all this is a model of reddit-like nested comment discussion boards with the major difference in functionality being that new comments and threads are presented in your browser without the requirement of a browser refresh. MongoDB provides the database. Anything that can be cached to improve performance is cached. The most recent thread trees are loaded into memory from the database on the start of the server to improve performance and reduce database calls.

Using:
>nodejs
>socket.io
>expressjs
>ejs
>less
>mongodb

Instructions:
You must have node and the packages stated above installed on your computer.

1. In terminal, when in the directory, enter: node app.js
2. In browser go to: http://localhost:3000