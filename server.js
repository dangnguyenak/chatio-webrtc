var express = require("express");
var app = express();
app.use(express.static("public"));

/**
 * setup template mặc định cho site là html, mặc định dùng package ejs để render
 * file frontend nằm trong folder views
 */
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");
app.set("views", "./views");

/**
 * cấu hình để khởi động server, post đang dùng 3000
 */
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(3000);

var usersList = [];// mảng Object lưu danh sách những người đăng ký vào chat
var i=0;
// event listen bất kì khi nào có kết nối nào vào server,
// hiểu đơn giản là có request vào site là nó sẽ bắt được event này
io.on('connection', function (socket) {
    console.log('Co nguoi thu '+(++i)+' ket noi: '+socket.id);

    // server nghe event client-send-username-register là event người dùng gửi username lên để đăng ký
    socket.on('client-send-username-register', function (data) {
        var found = usersList.some(function (obj) {
            //kiểm tra nếu username đã tồn tại trong hệ thống
            return obj.username === data.username;
        });

        if (found) {
            socket.emit('reg-fail'); //nếu đã tồn tại thì trả về client event đăng kí lỗi
        } else {
            usersList.push(data);
            //nếu chưa có thì cập nhật danh sách usersList push()
            socket.sUsername = data.username;
            // trả về client 2 events
            socket.emit('reg-success', data);//chỉ trả về client request đăng ký là đã thành công
            io.sockets.emit('list-users', usersList);//gửi về tất cả client danh sách users mới
        }
    });
    
    socket.on('disconnect', function () {
        //server nghe event khi có ai đó ngắt kết nối khỏi server, sẽ xóa user khỏi danh sách và gửi về tất cả
        //client danh sách user mới
        usersList.splice(usersList.indexOf(socket), 1);
        socket.broadcast.emit('list-users', usersList);
    });

    socket.on('message-to-send', function (messagesData) {
        //server nghe event khi người dùng gửi tin nhắn lên, bao gồm username, tin nhắn và thời gian gửi tin nhắn
        var iosocket;
        if (messagesData.options.isCall == true) {
            iosocket = io.to(socket.id);
        } else {
            iosocket = io.sockets;
        }
        iosocket.emit('server-send-response', {
            sUsername: socket.sUsername,
            message: messagesData.message,
            timeSendMessage: messagesData.timeSendMessage
        });
    });

});

/**
 * dùng ejs render file html
 * set route sẵn là file index mặc định khi truy cập
 */
app.get('/', function (request, result) {
    result.render('index', { title: 'ejs' });
});
