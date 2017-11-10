const mongoose = require('mongoose');
const Store = mongoose.model('Store');
// image upload middleware
const multer = require('multer');
const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next) {
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto) {
			next(null, true);
		} else {
			next({message: 'That file type isn\'t allowed'}, false);
		}
	}
}
// Allows photo resizing
const jimp = require('jimp');
// unique identifier package which prevents file name duplicates
const uuid = require('uuid');

exports.homePage = (req,res) => {
	console.log('name ', req.name);
	res.render('index');
};

exports.addStore = (req,res) => {
	res.render('editStore', {title: 'Add Store'});
};

// reads image into memory
exports.upload = multer(multerOptions).single('photo');

// resizes image
exports.resize = async (req,res,next) => {
	// check if there is no new file to upload 
	if(!req.file) {
		next();  //skip to next middleware
		return; //exits this method
	}
	// gets image extension from mimetype
	const extension = req.file.mimetype.split('/')[1];
	// gives image unique name
	req.body.photo = `${uuid.v4()}.${extension}`;
	// resizing images
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	// once the photo has been written to the file system, keep moving!
	next();
}

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
	// set the location type to point
	req.body.location.type = "Point";
	const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
		new: true, //return the new store instead of the old one
		runValidators: true
	}).exec();
	req.flash('success', `Successfully updated ${store.name} view store <a href="/stores/{store.slug}">View Store</a>` );
	res.redirect(`/stores/${store._id}/edit`);
};

// find store by slug
exports.getStoreBySlug = async (req, res, next) => {
	const store = await Store.findOne({slug: req.params.slug});
	if(!store) return next();
	res.render('store', {store, title: store.name});
};

// Get Store by tag
exports.getStoreByTag = async (req,res) => {
	const stores = await Store.getTagsList();
	res.json(stores); 
};