(function(){


    var socket = io('http://localhost:3000');

    var chat = {
        username: '',
        usersList : '',
        messageToSend: '',

        isCall: false,

        init: function() {
            this.initSocketEvent();

            $('#chatSection').hide();

            $('#login-btn').click(function (event) {
                event.preventDefault();

                // khởi tạo peerjs server để dùng stream video P2P
                var peer = new Peer({
                    key: 'peerjs',
                    host: 'peerjs-server5010.herokuapp.com',
                    secure: true,
                    port: 443,
                    // config: customConfig
                });
                //mỗi user khi request vào site đều có 1 peerID riêng
                //peer nghe event khi người dùng đăng ký username, gửi lên server gồm cả username và peerID
                peer.on('open', id => {
                    this.username = $('#username').val();
                    if (!this.username || this.username === '') {
                        $('#username').attr('title', 'Username cannot be empty');
                        $('#username').tooltip('show');
                        return;
                    }
                    $('#username').tooltip('hide');
                    socket.emit('client-send-username-register', {
                        username: this.username,
                        peerId: id,
                    });
                });

                //khi click vào 1 ai đó trong danh sách online sẽ gọi sang cho người 

                $('#onlineList').on('click', 'li', function() {
                    const peerId = $(this).find('div.name').attr('data-ui-id');
                    openStream()
                        .then(stream => {
                            playStream('local-video', stream);
                            const call = peer.call(peerId, stream);
                            call.on('stream', remoteStream => playStream('remote-video', remoteStream));
                        });
                    $('.chat-history').find('ul').empty();
                });
                peer.on('call', call => {
                    // người nhận được yêu cầu gọi sẽ nhận được thông báo trả lời video call
                    if (confirm('Take a call') == true) {
                        this.isCall = true;
                        // Clear chat all
                        // $('.chat-history').find('ul').empty();
                        openStream()
                            .then(stream => {
                                call.answer(stream);
                                playStream('local-video', stream);
                                call.on('stream', remoteStream => playStream('remote-video', remoteStream));
                            });
                    }
                });

            });

            /**
             * default init
             */
            this.cacheDOM();
            this.bindEvents();
        },
        initSocketEvent: function () {
            var chatHistory = $('.chat-history');
            // client nghe event reg-fail nếu như đăng lý lỗi, alert thôg báo tồn tại username
            socket.on('reg-fail', function () {
                alert('Username đã tồn tại');
            });
            // còn nếu đăng ký thành công, set this.username = username, ẩn form login, hiện formchat, và playvideo của camera
            socket.on('reg-success', function (data) {
                this.username = data.username;
                $('#hi-username').html('HI: '+this.username);
                $('#chatSection').show();
                $('#loginForm').hide();
                // Open video stream
                openStream().then(stream => playStream('remote-video', stream));
            });
            // client nghe event danh sách mỗi khi server gửi về, danh sách dùng để hiển thị người online trong thời điểm đó
            // danh sách được cập nhật realtime mỗi khi có người đăng ký thành công, hoặc có người thoát khỏi server
            socket.on('list-users', function (usersList) {
                $('ul.list').html('');
                $('#onlineUsers').html(usersList.length);
                usersList.forEach(function (i) {
                    $('ul.list').append(`
                        <li class="clearfix">
                            <img width="40px" height="40px" src="https://www.timeshighereducation.com/sites/default/files/byline_photos/default-avatar.png" alt="avatar" />
                            <div class="about">
                                <div class="name" data-ui-id="`+ i.peerId +`">` + i.username + `</div>
                            </div>
                        </li>
                    `);
                });
            });
            // client nghe event nhận phản hồi tin nhắn từ server, phản hồi là 1 object gồm username, thời gian gửi tin nhắn và tin nhắn gửi lên server
            socket.on('server-send-response', function (response) {

                var sUsername = response.sUsername;
                var timeSendMessage = response.timeSendMessage;
                var message = response.message;

                $('div.chat-history > ul').append(`
                    <li class="clearfix">
                        <div class="message-data align-right">
                            <span class="message-data-time">`+ timeSendMessage +`</span>
                            <span class="message-data-name" >`+ sUsername +`</span>

                        </div>
                        <div class="message other-message float-right">`+ message +`</div>
                    </li>
                `);
                // phân biệt tin nhắn gửi từ người khác và tin nhắn gửi từ mình lên
                var removeDivClass = $('div.chat-history > ul > li').last();
                if (this.username === sUsername) {
                    removeDivClass.removeClass('clearfix');
                    removeDivClass.find('div:eq(0)').removeClass('align-right');
                    removeDivClass.find('div:eq(1)').removeClass('other-message float-right').addClass('my-message');
                    removeDivClass.find('div:eq(0) > span:eq(1)').html('Me');
                }

                // cuộn đến cuối cùng màn hình chat
                chatHistory.scrollTop(chatHistory[0].scrollHeight);
            });
        },
        cacheDOM: function() {
            this.$button = $('button');
            this.$textarea = $('#message-to-send');
        },
        bindEvents: function() {
            this.$button.on('click', this.addMessage.bind(this));
            this.$textarea.on('keyup', this.addMessageEnter.bind(this));
        },
        addMessage: function() {
            // hàm lấy tin nhắn từ client, check ko trống thì gửi lên server qua event
            this.messageToSend = this.$textarea.val();
            var time = this.getCurrentTime();
            if (this.messageToSend.trim() !== '') {
                socket.emit('message-to-send', {
                    message: this.messageToSend,
                    timeSendMessage: time,
                    options: {
                        isCall: this.isCall,
                    }
                });
                this.$textarea.val('');
            }
        },
        addMessageEnter: function(event) {
            // enter was pressed
            // bắt sự kiện nếu như ấn enter thay vì click
            if (event.keyCode === 13) {
                this.addMessage();
            }
        },
        getCurrentTime: function() {
            // hàm lấy thời gian hiện tại, dùng cho gửi tin nhắn lên server
            return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        }

    };

    chat.init();
})();