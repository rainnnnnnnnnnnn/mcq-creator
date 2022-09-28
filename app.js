const express = require('express')
const session = require('express-session')
var passport = require('passport')
var crypto = require('crypto')
var routes = require('./routes')
const connection = require('./config/database')

const MongoStore = require('connect-mongo')

var app = express()
app.use(express.json())                             //parse http response       
app.use(express.urlencoded({extended:true}))

const sessionStore = MongoStore.create({
    mongoUrl: "mongodb://localhost:27017/login_db",
    mongoOptions: {
        useUnifiedTopology: true
    },
    collectionName: 'sessions'
})

app.use(session({                                   //session() middleware
    secret: "some-secret",
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 24*60*60*1000                       //expires in 1day
    }
}))

require('./config/passport')
app.use(passport.initialize())
app.use(passport.session())

//----------------static(root, {options})---------------------

app.use(express.static('static_files'))
app.use(express.static('other'))
app.use(routes)

app.listen(3000)