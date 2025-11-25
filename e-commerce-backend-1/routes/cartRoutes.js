// cartRoutes.js - Shopping cart routes
const express = require('express');
const {
    getCart, addCartItem, updateCartItem, removeCartItem,
    clearCart, validateCart, getCartItemCount, checkProductInCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
router.delete('/', clearCart);
router.get('/validate', validateCart);
router.get('/count', getCartItemCount);
router.get('/check/:productId', checkProductInCart);

module.exports = router;