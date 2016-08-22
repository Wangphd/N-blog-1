// var mongodb = require('./db');
var crypto = require('crypto');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/blog');

var userSchema = new mongoose.Schema({
  name: String,
  password: String,
  email: String,
  head: String
}, {
  collection: 'users'
});

var userModel = mongoose.model('User', userSchema);

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
  this.head = user.head;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {
  //要存入数据库的用户信息文档
  var user = {
      name: this.name,
      password: this.password,
      email: this.email,
      head: this.head
  };

  var newUser = new userModel(user);

  newUser.save(function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};

//读取用户信息
User.get = function(name, callback) {
  userModel.findOne({name: name}, function(err, user){
    if(err){
      return callback(err);
    }
    callback(null, user);
  })
};
