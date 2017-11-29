// library import
const mongoose =  require('mongoose');
mongoose.Promise =  global.Promise;
const slug =  require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates'
    }],
    address: {
        type: String,
        required: 'You must supply an address!'
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
});

storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', async function(next) {
	if(!this.isModified('name')) {
		return next(); //skip it
	}
	this.slug = slug(this.name); 
  // find stores with similar slugs
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`)
  // constructor is used to reference to a current models Object
  const storesWithSlug = await this.constructor.find({slug: slugRegEx});
  if(storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`
  }
  next();
});

// statics make you add methods
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind : '$tags' }, //mongo aggregation pipeline opertor
    { $group: { _id: '$tags', count: { $sum: 1} }}, //groups tag
    { $sort: {count: -1} } //sorts by highest tags
  ]); 
};

module.exports = mongoose.model('Store', storeSchema);