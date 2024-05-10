const express = require('express');
const router = express.Router();
const Products = require('../models/Products')
const methodOverride = require('method-override');
const Reviews = require('../models/Review');
const { validateProducts, isLoggedIn, isSeller, isProductAuthor } = require('../middleware');
const User = require('../models/User');

router.use(methodOverride('_method'))


// to show all products
router.get('/products', async (req, res) => {
    try{
        const products = await Products.find({});
        res.render('products/index', {products});
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }  
})

// new form
router.get('/products/new', isLoggedIn, isSeller, (req, res) => {
    try{
        res.render('products/new');
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

//actually adding
router.post('/products', isLoggedIn, isSeller, validateProducts, async (req, res) => {
    try{
        let {name, img, price, stock, desc} = req.body;
        let author = req.user._id;
        await Products.create({name, img, price, stock, desc, author});

        req.flash('success', 'Product added successfully');
        res.redirect('/products');
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

//show particular product
router.get('/products/:productId', isLoggedIn, async (req, res) => {
    try{
        let { productId } = req.params;        
        let foundProduct = await Products.findById(productId).populate('reviews');

        let userId = req.user._id;
        let user = await User.findById(userId);
        res.render('products/show', {foundProduct , user, msg: req.flash('msg')});
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

//show edit form
router.get('/products/:productId/edit', isLoggedIn, isSeller, isProductAuthor, async (req, res) => {
    try{
        let { productId } = req.params;
        let foundProduct = await Products.findById(productId);
        res.render('products/edit', {foundProduct});
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

//actully changing the product
router.patch('/products/:productId', isLoggedIn, isSeller, isProductAuthor, validateProducts, async (req, res) => {
    try{
        let { productId } = req.params;
        let {name, img, price, stock, desc} = req.body;
        await Products.findByIdAndUpdate(productId, {name, img, price, stock, desc});

        req.flash('success', 'Product updated successfully');
        res.redirect('/products');
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

//deleting
router.delete('/products/:productId', isLoggedIn, isSeller, isProductAuthor, async (req, res) => {
    try{
        let { productId } = req.params;
        let foundProduct = await Products.findById(productId);

        for(let ids of foundProduct.reviews){
            await Reviews.findByIdAndDelete(ids);
        } 

        // delete product from cart also
        let id = req.user._id;
        await User.findByIdAndUpdate(id, {$pull: {cart: productId}})

        await Products.findByIdAndDelete(productId);

        req.flash('success', 'Product deleted successfully');
        res.redirect('/products')
    }
    catch(e){
        console.log(e);
        res.render('error', {err:e.message})
    }
})

module.exports = router;