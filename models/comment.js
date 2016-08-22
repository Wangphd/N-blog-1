var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId;

function Comment(comment) {
  this.comment = comment;
}

module.exports = Comment;

var postModel = mongoose.model('Post');

//存储一条留言信息
Comment.prototype.save = function(id, callback) {
  var comment = this.comment;
  postModel.update({_id: ObjectID(id)}, {$push: {comments: comment}}, function(err, docs){
    if(err){
      return callback(err);
    }
    callback(null);
  })
};
