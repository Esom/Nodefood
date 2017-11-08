const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req,res) => {
	console.log('name ', req.name);
	res.render('index');
};

exports.addStore = (req,res) => {
	res.render('editStore', {title: 'Add Store'});
};

exports.createStore = async (req, res) => {
	const store = await (new Store(req.body)).save();
	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
	res.redirect('/store/${store.slug}');
};

exports.getStores = async (req, res) => {
	// find stores
	const stores = await Store.find();
	res.render('stores', {title: 'Stores' , stores });
};

exports.editStore = async (req, res) => {
	// Find store by id
	const store = await Store.findOne({_id: req.params.id});
	res.render('editStore', {title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
	const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
		new: true, //return the new store instead of the old one
		runValidators: true
	}).exec();
	req.flash('success', `Successfully updated ${store.name} view store <a href="/stores/{store.slug}">View Store</a>` );
	res.redirect(`/stores/${store._id}/edit`);
};