exports.checkLogin = function (req, res, next) {
    if (!req.session.user) {
      req.flash('error', '未登录!');
      res.redirect('/login');
    }
    next();
  }
exports.checkNotLogin = function(req, res, next) {
    if (req.session.user) {
      req.flash('error', '已登录!');
      res.redirect('back');
    }
    next();
  }
