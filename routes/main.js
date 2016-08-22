var index = require('./index'),
	user = require('./user');

module.exports = function (app) {
	index(app);
  user(app);
};
