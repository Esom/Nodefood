const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.loginForm = (req, res) => {
	res.render('login', {title: 'Login'});
}

exports.registerForm = (req, res) => {
	res.render('register', {title: 'Register'});
}

exports.validateForm = (req, res, next) => {
	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply a name!').notEmpty();
	req.checkBody('name', 'That email is not valid!').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false
	});
	req.checkBody('password', 'Password Cannot be Blank!').notEmpty();
	req.checkBody('password-confirm', 'Confirmed Password Cannot be Blank!').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password);
	// this checks all the validations above
	const errors = req.validationErrors();
	if (errors) {
		req.flash('error', errors.map(err => err.msg));
		res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
		return; //stops the fn from running
	}
	next(); //there were no errors!
};