const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const {catchErrors} = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));

router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/:id/edit', storeController.editStore);
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/add', authController.isLoggedIn, storeController.addStore);

router.post('/add', storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post('/add/:id', storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);


router.post('/register', userController.validateRegister, 
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', userController.updateAccount);

router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', authController.confirmedPasswords,
  catchErrors(authController.update)
);

router.get('/tags', catchErrors(storeController.getStoreByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoreByTag));

// Search api
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

// map page
router.get('/map', storeController.mapPage);

// like stores
router.post('/api/stores/:id/heart', catchErrors(storeController.heartStore));

// get hearted stores
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));

//reviews
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

// top stores
router.get('/top', catchErrors(storeController.getTopStores));


module.exports = router;

