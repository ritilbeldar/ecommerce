const express = require("express");
const router = express.Router();

const {
    usersignout,
    currentUser,

    user_dashboard,
    accountDetails,
    accountOrders,
    accountAddresses,
    accountWishlist,

    updateUserDetails,
    addProductToWishlist,
    removeProductFromWishlist,
    addToCart,
    removeToCart,
    CouponCodeApply,


    shopCart,
    shopCheckout,
    updateProductToWishlist,
    proceedToCheckout,
    AddressSave,
    AddressEdit,
    AddressUpdate,
    AddressDelete,
    AddAddress,
    placeOrder,
    paymentVerify,
    OrderConfirm,
    OrderView,
    rateReview,
    retry_payment,
} = require("../controllers/userController");
const { isAuthenticated } = require("../middlewares/user_auth");

// User Start

router.get("/", isAuthenticated, currentUser);

router.get("/signout", isAuthenticated, usersignout);

// User end


// user account start

router.get("/dashboard",isAuthenticated, user_dashboard);



// address start

router.get("/addresses",isAuthenticated, accountAddresses);

router.post("/address_save",isAuthenticated, AddressSave);

router.get("/address_edit/:id",isAuthenticated, AddressEdit);

router.post("/address_update",isAuthenticated, AddressUpdate);

router.get("/address_delete/:id",isAuthenticated, AddressDelete);

router.get("/add_address",isAuthenticated, AddAddress);


// address end

router.get("/wishlist",isAuthenticated, accountWishlist);

router.get("/account_details",isAuthenticated, accountDetails);


router.post("/update_User_Details",isAuthenticated, updateUserDetails);

router.post("/add_ProductTo_Wishlist/:id",isAuthenticated,  addProductToWishlist);

router.post("/update_ProductTo_Wishlist",isAuthenticated,  updateProductToWishlist);

router.get("/remove_ProductTo_Wishlist/:id",isAuthenticated,  removeProductFromWishlist);

router.get("/add_cart/:id",isAuthenticated,  addToCart);

router.get("/remove_cart/:id",isAuthenticated,  removeToCart);

// user account end

// order process start

router.get("/shopCart",isAuthenticated, shopCart);

router.get("/shopCheckout",isAuthenticated, shopCheckout);

router.post("/coupon_code_apply",isAuthenticated, CouponCodeApply);

router.post("/proceedToCheckout",isAuthenticated, proceedToCheckout);

router.post("/place_order",isAuthenticated, placeOrder);

router.get("/order_confirm/:id",isAuthenticated, OrderConfirm);

router.post("/verify",isAuthenticated, paymentVerify);

router.get("/orders",isAuthenticated, accountOrders);

router.get("/order_view/:id",isAuthenticated, OrderView);

router.get("/retry_payment/:id",isAuthenticated, retry_payment);

router.post("/rate_review",isAuthenticated, rateReview);


// order process end





module.exports = router;
