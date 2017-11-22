const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You have been logged out');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if ( req.isAuthenticated()) {
    next(); //carry on 
    return;
  }
  req.flash('error', 'Oops you must be logged in');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  console.log('req params '. req);
  // See if a user with that email exists
  const user = await User.findOne({email: req.body.email});

  if(!user) {
    req.flash('error', 'User doesn\'t exist');
    res.redirect('/login');
  }

  // Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1hr from now
  await user.save();

  // send user an email with the token
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  req.flash('success', `You have been email a password reset link. ${resetUrl}`);
  res.redirect('/login');
};