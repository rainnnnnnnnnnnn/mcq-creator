const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const connection = require('./database')
const User = connection.models.User
const validPassword = require('../lib/passwordUtils').validPassword

const verifyCallback = (username, password, callback) => {
    User.findOne({username: username})
        .then((user) => {
            if(!user) { return callback(null, false)}
            
            const isValid = validPassword(password, user.hash, user.salt)
 
            if(isValid) {
                return callback(null, user)
            }else return callback(null, false)
        })
        .catch((err) => {
            callback(err)
        })
}

const strategy = new LocalStrategy(verifyCallback)

passport.use(strategy)

passport.serializeUser((user, callback) => {
    callback(null, user.id)
})

passport.deserializeUser((userID, callback) => {
    User.findById(userID)
        .then((user) => {
            callback(null, user)
        })
        .catch(err => callback(err))
})

