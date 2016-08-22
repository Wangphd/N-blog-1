// var mongodb = require('./db');
var markdown = require('markdown').markdown;
var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId;
// mongoose.connect('mongodb://localhost/blog');

var postSchema = new mongoose.Schema({
  name: String,
  head: String,
  time: Object,
  title: String,
  tags: Array,
  post: String,
  comments: Array,
  reprint_from: Object,
  reprint_to: Array,
  pv: Number
}, {
  collection: 'posts'
});

  var postModel = mongoose.model('Post', postSchema);

function Post(name, head, title, tags, post) {
  this.name = name;
  this.head = head;
  this.title = title;
  this.tags = tags;
  this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  }
  //要存入数据库的文档
  var post = {
    name: this.name,
    head: this.head,
    time: time,
    title:this.title,
    tags: this.tags,
    post: this.post,
    comments: [],
    reprint_from: {},
    reprint_to: [],
    pv: 0
  };
  var newPost = new postModel(post);
  newPost.save(function(err, doc){
    if(err){
      return callback(err);
    }
    callback(null, doc);
  });
};

//读取文章及其相关信息,获取一个人的所有文章（传入参数 name）或获取所有人的文章（不传入参数）。
Post.getTen = function(name, page, callback) {
  var query = {};
  if (name) {
    query.name = name;
  }
  postModel.count(query).then(function(total){
    return postModel.find(query).skip((page - 1)*10).limit(10).sort({time: -1}).exec().then(function(docs){
      //解析 markdown 为 html
      docs.forEach(function (doc) {
        doc.post = markdown.toHTML(doc.post);
      });
      callback(null, docs, total);
    })
  }).catch(function(err){
    return callback(err);
  })
};

//获取一篇文章
Post.getOne = function(id, callback) {
  postModel.findOne({_id: ObjectID(id)}).then(function(doc){
    if(doc){
      postModel.update({_id: ObjectID(id)}, {
        $inc: {"pv": 1}
      })
    }
    //解析 markdown 为 html
    doc.post = markdown.toHTML(doc.post);
    doc.comments.forEach(function (comment) {
      comment.content = markdown.toHTML(comment.content);
    });
    callback(null, doc);//返回查询的一篇文章
  }).catch(function (err) {
    return callback(err);
  })
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(id, callback) {
  postModel.findOne({_id: ObjectID(id)})
           .then(function(doc){
             doc.post = markdown.toHTML(doc.post);
             doc.comments.forEach(function (comment) {
               comment.content = markdown.toHTML(comment.content);
             });
             callback(null, doc);
           })
           .catch(function (err) {
              return callback(err);
           })
};

//更新一篇文章及其相关信息
Post.update = function(id, post, callback) {
  postModel.update({_id: ObjectID(id)}, {$set: {post: post}}).then(callback(null)).catch(function(err){
    return callback(err);
  })
};

//删除一篇文章
Post.remove = function(id, callback) {
  postModel.findOne({_id: ObjectID(id)}).then(function(doc){
    //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
    var reprint_from = "";
    if (doc.reprint_from) {
      reprint_from = doc.reprint_from;
    }
    if (reprint_from != "") {
      postModel.update({_id: reprint_from._id}, {
        $pull: {
          "reprint_to": {
            "_id": ObjectID(id)
        }}
      });
    }
    postModel.findOne({_id: ObjectID(id)}).then(function (doc) {
      doc.remove().then(callback(null));
    });
    // postModel.remove({_id: ObjectID(id)}, {w: 1});
    // callback(null);
  }).catch(function (err) {
    return callback(err);
  })
};

//返回所有文章存档信息
Post.getArchive = function(name, callback) {
  postModel.find({name: name})
           .select({name: 1, time: 1, title: 1})
           .sort({time: -1})
           .exec(function(err, docs){
             if(err){
               return callback(err);
             }
             console.log(docs);
             callback(null, docs)
           })
};

//返回所有标签
Post.getTags = function(callback) {
  postModel.distinct("tags", function(err, docs){
    if(err){
      return callback(err);
    }
    callback(null, docs);
  })
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
  postModel.find({tags: tag})
           .select({
             "name": 1,
             "time": 1,
             "title": 1
           })
           .sort({time: -1})
           .exec(function(err, docs){
              if(err){
                return callback(err);
              }
              callback(null, docs);
            })
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
  var pattern = new RegExp(keyword, "i");
  postModel.find({title: pattern})
           .select({
             "name": 1,
             "time": 1,
             "title": 1
           })
           .sort({time: -1})
           .exec(function(err, docs) {
             console.log(docs);
             if(err){
               return callback(err);
             }
             callback(null, docs);
           })
};

//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
  postModel.findOne({_id: reprint_from._id})
           .exec(function(err, doc){
             if (err) {
               return callback(err);
             }
             var date = new Date();
             var time = {
                 date: date,
                 year : date.getFullYear(),
                 month : date.getFullYear() + "-" + (date.getMonth() + 1),
                 day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                 minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                 date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
             }
             //更新被转载的原文档的 reprint_info 内的 reprint_to
            //  delete doc._id;//注意要删掉原来的 _id
             var post = {
               name: reprint_to.name,
               head: reprint_to.head,
               time: time,
               title: (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title,
               comments: [],
               post: doc.post,
               reprint_from: reprint_from,
               pv: 0
             }
             var newPostModel = new postModel(post);
             //将转载生成的副本修改后存入数据库，并返回存储后的文档
             newPostModel.save(doc, function(err, post){
                        if(err){
                          return callback(err);
                        }
                        postModel.update({_id: reprint_from._id}, {$push: {reprint_to: { name: post.name, _id: post._id } }}, function(err){
                          if(err){
                            return callback(err);
                          }
                        callback(null, post)
                      })
                    })
             })
};
