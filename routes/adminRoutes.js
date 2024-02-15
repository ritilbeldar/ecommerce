const express = require("express");
const router = express.Router();

const {
  login,
  singup,
  adminsignup,
  verifyemaill,
  verifyemail,
  adminsignin,
  adminsignout,
  homepage,

  addcategories,
  categoriesadd,
  subcategoriesadd,
  categoriesEdit,
  categoriesUpdate,
  categoriesDelete,

  addSubcategories,
  subcategoryDelete,
  subcategoriesEdit,
  subcategoriesUpdate,

  AddHomeBanner,
  HomeBannerAdd,
  HomeBannerStatuChange,
  HomeBannerDelete,
  HomeBannerEdit,
  HomeBannerUpdate,

  AddProducts,
  ProductsList,
  ProductsAdd,
  add_productsColorImg,
  AddColorImagesToProduct,
  EditProducts,
  ProductUpdate,
  ProductView,
  rateReview,

  addCoupon,
  CouponAdd,
  updateCouponStatus,
  couponDelete,
  couponEdit,
  couponUpdate,
  addShipping,
  ShippingAdd,

  customerList,
  customerView,

  ordersList,
  oderView,
  orderStatusChange,
} = require("../controllers/adminController");
const { isAuthenticated } = require("../middlewares/auth");

// GET /
router.get("/login", login);

router.post("/adminsignin", adminsignin);

router.get("/adminsignout", isAuthenticated, adminsignout);

router.get("/singup", singup);

router.post("/adminsignup", adminsignup);

router.get("/admin/verify/:verificationToken", verifyemaill);

router.get("/verifyemail", verifyemail);

router.get("/dashboard", isAuthenticated, homepage);

// categories start

router.get("/add_categories", isAuthenticated, addcategories);

router.post("/categoriesadd", isAuthenticated, categoriesadd);

router.get("/category_edit/:id", isAuthenticated, categoriesEdit);

router.post("/categories_update/:id", isAuthenticated, categoriesUpdate);

router.get("/categories_delete/:id", isAuthenticated, categoriesDelete);

router.post("/subcategoriesadd", isAuthenticated, subcategoriesadd);

router.get("/add_subcategories", isAuthenticated, addSubcategories);

router.get(
  "/subcategories_delete/:subcategoryId",
  isAuthenticated,
  subcategoryDelete
);

router.get("/subcategory_edit/:id", isAuthenticated, subcategoriesEdit);

router.post("/subcategories_update/:id", isAuthenticated, subcategoriesUpdate);

// categories end

// home banner start

router.get("/add_home_banner", isAuthenticated, AddHomeBanner);

router.post("/home_banner_add", isAuthenticated, HomeBannerAdd);

router.post(
  "/updateBannerStatus/:bannerId",
  isAuthenticated,
  HomeBannerStatuChange
);

router.get("/homeBanner_delete/:bannerId", isAuthenticated, HomeBannerDelete);

router.get("/homeBanner_edit/:bannerId", isAuthenticated, HomeBannerEdit);

router.post("/homeBanner_update/:bannerId", isAuthenticated, HomeBannerUpdate);

// home banner end

// Products start

router.get("/add_products", isAuthenticated, AddProducts);

router.get("/products_list", isAuthenticated, ProductsList);

router.post("/products_add", isAuthenticated, ProductsAdd);

router.get("/add_productsColorImg/:id", isAuthenticated, add_productsColorImg);

router.post(
  "/AddColorImagesToProduct/:id",
  isAuthenticated,
  AddColorImagesToProduct
);

router.get("/product_edit/:id", isAuthenticated, EditProducts);

router.post("/product_update/:id", isAuthenticated, ProductUpdate);

router.get("/product_view/:id", isAuthenticated, ProductView);

router.post("/rate_review", isAuthenticated, rateReview);


// Products END



// Coupon code start

router.get("/add_coupon", isAuthenticated, addCoupon);

router.post("/coupon_add", isAuthenticated, CouponAdd);

router.post("/updateCouponStatus/:id", isAuthenticated , updateCouponStatus);

router.get("/coupon_delete/:id", isAuthenticated, couponDelete);

router.get("/coupon_Edit/:id", isAuthenticated, couponEdit);

router.post("/coupon_update/:id", isAuthenticated, couponUpdate);

router.get("/add_shipping", isAuthenticated, addShipping);

router.post("/shipping_add", isAuthenticated, ShippingAdd);


// Coupon code end


// customers start

router.get("/customer_list", isAuthenticated, customerList);

router.get("/customer_view/:id", isAuthenticated, customerView);

// customers  end


// orders start

router.get("/orders_list", isAuthenticated, ordersList);

router.get("/oder_view/:id", isAuthenticated, oderView);

router.post("/order_status_change/:id", isAuthenticated, orderStatusChange);

// orders  end


module.exports = router;
