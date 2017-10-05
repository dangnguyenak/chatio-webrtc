(function(){


    var socket = io('http://localhost:3000');
    var chat = {
        username: '',
        messageToSend: '',

        init: function() {
            this.initSocketEvent();

            $('#chatSection').hide();
            $('#login-btn').click(function (event) {
                event.preventDefault();
                this.username = $('#username').val();
                if (!this.username || this.username === '') {
                    $('#username').attr('title', 'Username cannot be empty');
                    $('#username').tooltip('show');
                    return;
                }
                $('#username').tooltip('hide');
                socket.emit('client-send-username-register', $('#username').val());
            });

            /**
             * default init
             */
            this.cacheDOM();
            this.bindEvents();
        },
        initSocketEvent: function () {

            socket.on('reg-fail', function () {
                alert('Username đã tồn tại');
            });

            socket.on('reg-success', function (username) {
                this.username = username;
                $('#hi-username').html(username);
                $('#chatSection').show();
                $('#loginForm').hide();
            });

            socket.on('list-users', function (usersList) {
                $('ul.list').html('');
                $('#onlineUsers').html(usersList.length);
                usersList.forEach(function (i) {
                    $('ul.list').append(`
                        <li class="clearfix">
                            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg" alt="avatar" />
                            <div class="about">
                                <div class="name">` + i + `</div>
                            </div>
                        </li>
                    `);
                });
            });

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

                var removeDivClass = $('div.chat-history > ul > li').last();
                if (this.username === sUsername) {
                    removeDivClass.removeClass('clearfix');
                    removeDivClass.find('div:eq(0)').removeClass('align-right');
                    removeDivClass.find('div:eq(1)').removeClass('other-message float-right').addClass('my-message');
                    removeDivClass.find('div:eq(0) > span:eq(1)').html('Me');
                }

                var chatHistory = $('.chat-history');
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
            this.messageToSend = this.$textarea.val();
            var time = this.getCurrentTime();
            if (this.messageToSend.trim() !== '') {
                socket.emit('message-to-send', {
                    message: this.messageToSend,
                    timeSendMessage: time
                });
                this.$textarea.val('');
            }
        },
        addMessageEnter: function(event) {
            // enter was pressed
            if (event.keyCode === 13) {
                this.addMessage();
            }
        },
        getCurrentTime: function() {
            return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        }

    };

    chat.init();
})();