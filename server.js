require('dotenv').config();

var express = require('express');
var app = express();

var http = require('http');
var server = http.createServer(app);

var socketIO = require('socket.io');
var io = socketIO(server);

const connections = new Set();
let connectCounter = 0;

app.use(express.static(__dirname + '/node_modules'));
app.use('/static', express.static(__dirname + '/static'));

app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/chat.html');
});

function getFormattedTime(){
    var date = new Date();
    var time = date.toTimeString();
    time = time.split(' ')[0];
    return time;
}

io.on('connection', function (client) {
    client.on('join', function (username) {
        // attach username to the client
        client.username = username;

        // add client to the set of connected clients
        connections.add(client);

        // emit to the current user the number of users in the chat
        client.emit('user_count', connections.size);
        
        // emit to other users that a new user has joined
        client.broadcast.emit('new_user', `${username}`);
        
        client.on('messages', function (data) {
            client.emit('broad', {
                username: data.username,
                message: data.message,
                me: true,
                time: getFormattedTime(),
            });

            client.broadcast.emit('broad', {
                username: data.username,
                message: data.message,
                time: getFormattedTime(),
            });
        });
    });    
    
    // when the client disconnects from the socket
    client.on('disconnect', function () { 
        client.broadcast.emit('user_left', client.username);
        connections.delete(client);
    });
});


const PORT = process.env.PORT || 9000;

server.listen(4200, function(){
    console.log('\x1b[32m%s\x1b[0m', `Server is listening on PORT: ${PORT}`);
});