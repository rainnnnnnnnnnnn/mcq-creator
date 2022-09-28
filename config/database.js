const mongoose = require('mongoose')

//DB_STRING = mongodb://<USER>:<PASSWORD>@localhost:27017/DATABASE_NAME

const connection = mongoose.createConnection("mongodb://localhost:27017/login_db", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const UserSchema = new mongoose.Schema({
    full_name: String,
    username: String,
    hash: String,
    salt: String,
    role: String
})

const TestSchema = new mongoose.Schema({
    test_id: String,
    test_name: String,
    created_by: String,
    questions: Array,
    given_by: Number
})

const ScoreSchema = new mongoose.Schema({
    test_id: String, 
    test_name: String,
    submitted_by: String,
    score: String
})

const User = connection.model('User', UserSchema)
const Test = connection.model('Test', TestSchema)
const Score = connection.model('Score', ScoreSchema)
//
module.exports = connection