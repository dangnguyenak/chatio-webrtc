var express = require("express");
var app = express();
app.use(express.static("public"));

/**
 * set default template is html by default ejs extension
 */
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");
app.set("views", "./views");

/**
 * config to start server nodejs
 */
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000);

/**
 *
 * @type {Array}
 */
var usersList = [];
io.on('connection', function (socket) {
    console.log('Co nguoi ket noi: '+socket.id);

    socket.on('client-send-username-register', function (data) {
        if (usersList.indexOf(data) >= 0) {
            socket.emit('reg-fail');
        } else {
            usersList.push(data);
            socket.sUsername = data;
            socket.emit('reg-success', data);
            io.sockets.emit('list-users', usersList);
            console.log(data);
        }
    });
    
    socket.on('disconnect', function () {
        usersList.splice(usersList.indexOf(socket.sUsername), 1);
        socket.broadcast.emit('list-users', usersList);
    });

    socket.on('message-to-send', function (messages) {
        io.sockets.emit('server-send-response', {
            sUsername: socket.sUsername,
            message: messages.message,
            timeSendMessage: messages.timeSendMessage
        });
    });

    socket.on('someone-typing', function () {
        console.log(socket.sUsername + 'dang go message');
    });

    socket.on('someont-stop-typing', function () {
        console.log(socket.sUsername + 'stop go message');
    });
})

/**
 * set routes for template files
 */
app.get('/', function (request, result) {
    result.render('index', { title: 'ejs' });
});