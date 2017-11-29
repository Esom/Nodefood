const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
    req.body.author = req.user._id;
    console.log('author', req.body.author);
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // find stores
    const stores = await Store.find();
    res.render('stores', {title: 'Stores' , stores });
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it!');
    }
};

exports.editStore = async (req, res) => {
    //Find store by id
    const store = await Store.findOne({_id: req.params.id});
    confirmOwner(store, req.user);
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
    const store = await Store.findOne({slug: req.params.slug}).populate('author');
    if(!store) return next();
    res.render('store', {store, title: store.name});
};

// Get Store by tag
exports.getStoreByTag = async (req,res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true, $ne: [] };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({tags: tagQuery});
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag',{tags, title: 'Tags', tag, stores });
};

// search store
exports.searchStores = async (req, res) => {
    const stores = await Store
    // first find stores
    .find({
        // MongoDB $text operator searches text index  
        $text: {
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore' }
    })
    // sort stores bases on textScore
    .sort({
        score: { $meta: 'textScore' }
    })
    //limit to only 5 results
    .limit(5)
    res.json(stores);
}

exports.mapStores = async (req,res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 //10kmc
            }
        }
    };
    // limiting data sent via json
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
};

exports.mapPage = async (req, res) => {
    res.render('map', {title: 'Maps'});
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    // check if hearts id is the same as the id in request params
    // $pull & $ $addToSet are mongo operators , $addToSet maintains uniqueness in an array 
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    // find one user & update since hearts field does not exist yet
    const user = await User.findByIdAndUpdate(req.user._id,
        { [operator]: { hearts: req.params.id }},
        { new: true }
    );
    res.json(user);
};