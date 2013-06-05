var http = require('http'),
    express = require('express'),
    socketio = require('socket.io'),
    h = require('handlebars'),
    SessionSockets = require('session.socket.io'),
    RedisStore = require('connect-redis')(express),
    redis = require('redis').createClient(),
    _ = require('underscore'),
    app = express(),
    server = http.createServer(app),
    sio = socketio.listen(server);

var cookieParser = express.cookieParser('cahclone');
var sessionStore = new RedisStore({ host: 'localhost', port: 6379, client: redis });
var sessionSockets = new SessionSockets(sio, sessionStore, cookieParser);

var WhiteCards = [0, 1,2,3,4,5,6,7,8,9,10];
var BlackCards = [0, 1,2,3,4,5,6,7,8,9,10];

var Games = {};

var Game = {
    init: function(name) {
        this.Name = name;
    },

    Name: '',
    Players: [],
    CardCzar: '',
    BlackCard: [],
    UsedWhiteCards: [],
    UsedBlackCards: [],

    drawBlackCard: function(gameName, usedCardIDs) {
        console.warn(usedCardIDs);
        var cardsLeft = _.difference(BlackCards, usedCardIDs),
            selectedCard = cardsLeft[Math.floor(Math.random() * cardsLeft.length)];

        if (cardsLeft.length == 0) {
            console.log("OUT OF BLACK CARDS");
            return -1;
        }

        usedCardIDs.push(selectedCard);
        console.warn('Z', cardsLeft,'|' , selectedCard, '|', usedCardIDs);
        redis.set(gameName+':UWC', usedCardIDs);
        return selectedCard;

    },

    drawWhiteCard: function(gameName, usedCardIDs) {
        console.warn(usedCardIDs);
        var cardsLeft = _.difference(WhiteCards, usedCardIDs),
            selectedCard = cardsLeft[Math.floor(Math.random() * cardsLeft.length)];

        if (cardsLeft.length == 0) {
            console.log("OUT OF WHITE CARDS");
            return -1;
        }

        usedCardIDs.push(selectedCard);
        console.warn('Z', cardsLeft,'|' , selectedCard, '|', usedCardIDs);
        redis.set(gameName+':UWC', usedCardIDs);
        return selectedCard;
    },
    
};

app.configure(function(){
    app.set('view engine', 'handlebars');
    app.set("view options", { layout: false }); 
    app.set('secret', 'cahclone');
    //app.use(express.logger());
    app.use(cookieParser);
    app.use(express.session({ store: sessionStore, secret: 'cahclone' }));
});

app.get('/', function(req, res){
    req.session.test = 'test';
    res.render('index.hbs', {});
});

app.get('/game/:name?', function(req, res) {
    var gameName = req.params.name;
    req.session.gameName = gameName;
    
    redis.set(gameName+':UWC', [0]);
    req.session.save();
    res.render('game.hbs', {});
});

sessionSockets.on('connection', function (err, socket, session) {
    socket.emit('connection', { msg: 'connected' });
    socket.on('ping', function(data) {
        socket.emit('pong');
    });
    socket.on('getSession', function() {
        socket.emit('session', {session: session});
    });
    socket.on('getGameName', function() {
        socket.emit('game', {game: session.gameName});
    });
    socket.on('newGame', function() {
        //socket.emit('game', {game: session.gameName});
        var gameName = session.gameName;

        
    });
    socket.on('drawWhiteCard', function() {
        var gameName = session.gameName;
        redis.get(gameName+':UWC', function(err, reply) { 
            console.warn('P', reply);
            if (reply) {
                var usedWhiteCards = reply.split(",").map(function(x){return parseInt(x)}); 
                socket.emit('whiteCard', {card: Game.drawWhiteCard(gameName, usedWhiteCards)});
            }
        });
    });
    socket.on('drawBlackCard', function() {
        var gameName = session.gameName;
        redis.get(gameName+':UWC', function(err, reply) { 
            console.warn('P', reply);
            if (reply) {
                var usedBlackCards = reply.split(",").map(function(x){return parseInt(x)}); 
                socket.emit('blackCard', {card: Game.drawBlackCard(gameName, usedBlackCards)});
            }
        });
    });
    socket.on('getGameName', function() {
        socket.emit(session.gameName);
    });
    session.socketID = socket.id;
    session.save();
});

server.listen('8081');
