const express = require("express");
const router = express.Router();

const {
    notfound,
    homepage,
    ProductsDetails,
    SubCategoryProducts,
    SaveNewsletter,

    userRegister,
    Register_Login,
    usersignin,
    verify_otp,
    otp_verify,
    
} = require("../controllers/indexController");

const { isAuthenticated } = require("../middlewares/user_auth");

// GET /
router.get("/404", notfound);

router.get("/", homepage);


// Products Start

router.get("/products_details/:id",  ProductsDetails);

router.get("/user/products_details/:id",isAuthenticated, ProductsDetails);

router.get("/subcategory_Products/:id", SubCategoryProducts);

router.get("/user/subcategory_Products/:id", isAuthenticated, SubCategoryProducts);

// Products End


router.get("/login_register", Register_Login);

router.get("/verify_otp/:id", verify_otp);

router.post("/verify_otp/:id", otp_verify);


router.post("/userregister", userRegister);

router.post("/usersignin", usersignin);

router.post("/save_news_letter", SaveNewsletter);




module.exports = router;
