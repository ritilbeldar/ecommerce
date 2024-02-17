const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const { isAuthenticated } = require("../middlewares/auth");
const Admin = require("../models/admin/admin");
const Category = require("../models/admin/categorysModel/category");
const SubCategory = require("../models/admin/categorysModel/subcategory");
const HomeBanner = require("../models/admin/categorysModel/HomeBanner");
const Wishlist = require("../models/frontend/wishlistModel");
const Products = require("../models/admin/ProductsModel/Products");
const Orders = require("../models/frontend/orderModel");
const Shipping = require("../models/admin/ProductsModel/ShippingModel");
const Coupon = require("../models/admin/marketing/CouponModel");
const User = require("../models/frontend/userModel");
const RateReviews = require("../models/frontend/rateReviewModel");
const ErorrHandler = require("../utils/ErrorHandler");
const otpSend = require("../utils/otpmailer");
const {AdminSendToken} = require("../utils/AdminSendToken");

const path = require("path");
const CryptoJS = require("crypto-js");
const imagekit = require("../utils/imagekit").initImageKit();

exports.homepage = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const rateReviews = await RateReviews.find() 
    .populate({
      path: "Product",
    })
    .populate({
      path: "User",
    })
    const orders = await Orders.find()
    .populate({
      path: "user",
    })
    .populate({
      path: "orderProducts.item",
      model: "Product",
    })
    .populate({
      path: "orderAddress",
    })
    .populate({
      path: "onlinepayment",
    })
    .exec();

    const users = await User.find().populate({
      path: "UserWishlists",
    })
    .populate({
      path: "UserCart",
    })
    .populate({
      path: "UserOrders",
      populate: {
        path: "orderProducts.item",
        model: "Product",
      },
    })
    .exec();

    const wishlists = await Wishlist.find()

    res.render("backend/index", {
      title: "Dashboard",
      admin,
      orders,
      users,
      wishlists,
      rateReviews,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin");
  }
});

exports.login = catchAsyncErrors(async (req, res, next) => {
  try {
    const { admintoken } = req.cookies;
    if (admintoken) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("backend/authentication/login", {
        title: "Login",
        messages: req.flash(),
      });
    }
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.singup = catchAsyncErrors(async (req, res, next) => {
  try {
    res.render("backend/authentication/singup", {
      title: "Singup",
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});
// 

exports.adminsignup = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, fullname } = req.body;
    let admin = await Admin.findOne({ email });

    if (admin) {
      if (admin.verified) {
        req.flash("error", "This email is already registered.");
        return res.redirect("back");
      } else {
        // Resend OTP if the email is registered but not verified
        const otp = Math.floor(1000 + Math.random() * 9000);
        admin.otp = otp;
        await admin.save();
        await otpSend(email, otp, fullname);
        
        req.flash("success", "OTP sent to your email for verification.");
        return res.redirect(`/admin/verify_otp/${admin.id}`);
      }
    } else {
      // If admin doesn't exist, create a new one
      const otp = Math.floor(1000 + Math.random() * 9000);

      admin = new Admin({
        ...req.body,
        otp,
      });
      await admin.save();

      await otpSend(email, otp, fullname);

      req.flash("success", "OTP sent to your email for verification.");
      res.redirect(`/admin/verify_otp/${admin.id}`);
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong. Please try again later.");
    res.redirect("back");
  }
});


exports.admin_verify_otp = catchAsyncErrors(async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ErorrHandler('User not found', 404);
    }
    const { admintoken } = req.cookies;
    if (admintoken) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("backend/authentication/verify_otp", {
        title: "Verify OTP",
        messages: req.flash(),
        isAuthenticated: false,
        admin,
      });
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/singup");
  }
});

exports.otp_verify = catchAsyncErrors(async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { otp } = req.body;

    // Find the user by ID
    const admin = await Admin.findById(adminId);

    // Check if the user exists
    if (!admin) {
      throw new ErorrHandler('Admin not found', 404);
    }

    // Check if the OTP matches
    if (!admin.otp || otp !== admin.otp.toString()) {
      req.flash('error', 'Invalid OTP. Please try again.');
      return res.redirect('back');
    }

    // Mark the user as verified
    admin.verified = true;
    admin.otp = undefined;
    await admin.save();

    req.flash("success", "You have successfully verified. now proceed to log in.")
    res.redirect("/admin/login");
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong. Please try again later.');
    res.redirect('back');
  }
});

exports.adminsignin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;


    const admin = await Admin.findOne({ email }).select("+password +verified");

    if (!admin) {
      req.flash("error", "User not found with this email address.");
      return res.redirect("back");
    }

    if (!admin.verified) {
      req.flash("error", "Your email is not verified. Please verify your email to login.");
      return res.redirect("back");
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await admin.comparepassword(password);
    if (!isMatch) {
      req.flash("error", "Wrong credentials.");
      return res.redirect("back");
    }

    // If the credentials are correct, generate and send token
    AdminSendToken(admin, 200, res);
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

exports.adminsignout = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("admintoken");
  req.flash("warning", "Admin Logout Successfully");
  res.redirect("/admin/login");
});

// categories start

exports.addcategories = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const categorys = await Category.find().populate("subcategories");
    res.render("backend/categories/add_categories", {
      admin,
      categorys,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.categoriesadd = catchAsyncErrors(async (req, res, next) => {
  const category = await new Category(req.body).save();
  res.redirect("/admin/add_categories");
});

exports.categoriesEdit = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    res.render("backend/categories/edit_categories", {
      category,
      admin,
      messages: req.flash(),
    });
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    next(error);
  }
});

exports.categoriesUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const { title, url } = req.body;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { title, url },
      { new: true } 
    );

    req.flash("success", "Category updated successfully");
    res.redirect("/admin/add_categories");
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    req.flash("error", "Error updating category");
    res.redirect("/admin/add_categories");
  }
});

exports.categoriesDelete = catchAsyncErrors(async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId).exec();

    if (!category) {
      throw new ErorrHandler("Category not found", 404);
    }
    const subcategories = category.subcategories;

    await SubCategory.deleteMany({ _id: { $in: subcategories } });

    await Category.findByIdAndDelete(categoryId);

    req.flash("warning", "Removed Successfully");
    res.redirect("/admin/add_categories");
  } catch (err) {
    // Handle errors
    return next(err);
  }
});

exports.addSubcategories = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const categorys = await Category.find().populate("subcategories");
    res.render("backend/categories/add_Subcategories", {
      admin,
      categorys,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.subcategoriesadd = catchAsyncErrors(async (req, res, next) => {
  try {
    const { shortTitle, title, title2, categoryTitle,endDate, bannerPosition } =
      req.body;
    const existingCategory = await Category.findOne({ title: categoryTitle });

    if (!existingCategory) {
      return res
        .status(400)
        .json({ error: "Selected category does not exist" });
    }

    let subCategoryBannerId, subCategoryBannerUrl;

    // Check if subCategoryBanner is provided
    if (req.files && req.files.subCategoryBanner) {
      const subCategoryBanner = req.files.subCategoryBanner;
      const modifiedBannerFileName = `subCategoryBanner-${Date.now()}${path.extname(
        subCategoryBanner.name
      )}`;

      // Assuming imagekit is properly initialized and available
      const { fileId, url } = await imagekit.upload({
        file: subCategoryBanner.data,
        fileName: modifiedBannerFileName,
      });

      subCategoryBannerId = fileId;
      subCategoryBannerUrl = url;
    }

    const newSubCategory = new SubCategory({
      shortTitle,
      title,
      title2,
      endDate,
      bannerPosition,
      // Add subCategoryBanner only if it exists
      ...(subCategoryBannerId &&
        subCategoryBannerUrl && {
          subCategoryBanner: {
            fileId: subCategoryBannerId,
            url: subCategoryBannerUrl,
          },
        }),
      parentCategory: existingCategory._id,
    });

    await newSubCategory.save();

    existingCategory.subcategories.push(newSubCategory._id);
    await existingCategory.save();

    res.redirect("/admin/add_subcategories");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.subcategoryDelete = catchAsyncErrors(async (req, res, next) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    const subcategory = await SubCategory.findById(subcategoryId).exec();

    if (!subcategory) {
      throw new ErorrHandler("SubCategory not found", 404);
    }

    // Find the Category containing the subcategory and remove the reference
    await Category.updateOne(
      { subcategories: subcategoryId },
      { $pull: { subcategories: subcategoryId } }
    );

    await SubCategory.findByIdAndDelete(subcategoryId);

    req.flash("warning", "Removed Successfully");
    res.redirect("/admin/add_subcategories");
  } catch (err) {
    // Handle errors
    return next(err);
  }
});

exports.subcategoriesEdit = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const categorys = await Category.find();
    const subcategoryId = req.params.id;
    const subcategory = await SubCategory.findById(subcategoryId).populate(
      "parentCategory"
    );

    res.render("backend/categories/edit_subcategories", {
      subcategory,
      admin,
      categorys,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

exports.subcategoriesUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    const subcategoryId = req.params.id;
    const { shortTitle, title, title2, endDate, categoryTitle } = req.body;

    const updatedSubcategory = await SubCategory.findById(
      subcategoryId
    ).populate("parentCategory");

    if (!updatedSubcategory) {
      return res.status(404).json({ error: "Subcategory not found" });
    }

    const existingCategory = await Category.findOne({ title: categoryTitle });

    if (!existingCategory) {
      return res
        .status(400)
        .json({ error: "Selected category does not exist" });
    }

    // Update fields
    updatedSubcategory.shortTitle = shortTitle;
    updatedSubcategory.title = title;
    updatedSubcategory.title2 = title2;
    updatedSubcategory.endDate = endDate;
    updatedSubcategory.parentCategory = existingCategory._id;

    // Check if new image is provided
    const subCategoryBanner = req.files && req.files.subCategoryBanner;

    if (subCategoryBanner) {
      const modifiedBannerFileName = `subCategoryBanner-${Date.now()}${path.extname(
        subCategoryBanner.name
      )}`;
      const { fileId: subCategoryBannerId, url: subCategoryBannerUrl } =
        await imagekit.upload({
          file: subCategoryBanner.data,
          fileName: modifiedBannerFileName,
        });

      // Update the subcategory's banner information
      updatedSubcategory.subCategoryBanner = {
        fileId: subCategoryBannerId,
        url: subCategoryBannerUrl,
      };
    }

    // Save the updated subcategory
    await updatedSubcategory.save();

    res.redirect("/admin/add_subcategories");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// categories end


// home banner start

exports.AddHomeBanner = catchAsyncErrors(async (req, res, next) => {
  try {
    const bannerId = req.params.bannerId;
    const banner = await HomeBanner.findById(bannerId);
    const admin = await Admin.findById(req.id);
    const homebanners = await HomeBanner.find();
    res.render("backend/home_banner/add_banner", {
      admin,
      banner,
      homebanners,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.HomeBannerAdd = catchAsyncErrors(async (req, res, next) => {
  try {
    const { backgroundBanner, bannerImg, ...bannerData } = req.body;

    const bannerEvent = new HomeBanner(bannerData);

    const backgroundBannerFile = req.files.backgroundBanner;
    const modifiedBannerFileName = `backgroundBanner-${Date.now()}${path.extname(
      backgroundBannerFile.name
    )}`;

    if (
      bannerEvent.backgroundBanner &&
      bannerEvent.backgroundBanner.fileId !== ""
    ) {
      await imagekit.deleteFile(bannerEvent.backgroundBanner.fileId);
    }

    const { fileId: backgroundBannerFileId, url: backgroundBannerUrl } =
      await imagekit.upload({
        file: backgroundBannerFile.data,
        fileName: modifiedBannerFileName,
      });

    bannerEvent.backgroundBanner = {
      fileId: backgroundBannerFileId,
      url: backgroundBannerUrl,
    };

    if (req.files.bannerImg) {
      const bannerImgFile = req.files.bannerImg;
      const modifiedProfileFileName = `bannerImg-${Date.now()}${path.extname(
        bannerImgFile.name
      )}`;

      if (bannerEvent.bannerImg && bannerEvent.bannerImg.fileId !== "") {
        await imagekit.deleteFile(bannerEvent.bannerImg.fileId);
      }

      const { fileId: bannerImgFileId, url: bannerImgUrl } =
        await imagekit.upload({
          file: bannerImgFile.data,
          fileName: modifiedProfileFileName,
        });

      bannerEvent.bannerImg = {
        fileId: bannerImgFileId,
        url: bannerImgUrl,
      };
    }

    await bannerEvent.save();

    req.flash("success", "Home Banner Added Successfully");
    res.redirect("/admin/add_home_banner");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while adding the blog");
    res.redirect("/admin/add_home_banner");
  }
});

exports.HomeBannerStatuChange = catchAsyncErrors(async (req, res, next) => {
  const { bannerId } = req.params;
  const { status, publishdate } = req.body;

  try {
    const updateQuery = { $set: { status } };

    // Check if publishdate is provided
    if (publishdate) {
      updateQuery.$set.publishdate = publishdate;
    }

    const bannerToUpdate = await HomeBanner.findOneAndUpdate(
      { _id: bannerId },
      updateQuery,
      { new: true }
    );

    if (!bannerToUpdate) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    return res.redirect("/admin/add_home_banner");
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

exports.HomeBannerDelete = catchAsyncErrors(async (req, res, next) => {
  const bannerId = req.params.bannerId;

  try {
    const deletedBanner = await HomeBanner.findByIdAndDelete(bannerId);

    if (!deletedBanner) {
      req.flash("error", "Home Banner not found");
      return res.redirect("/admin/add_home_banner");
    }
    req.flash("success", "Home Banner deleted successfully");
    return res.redirect("/admin/add_home_banner");
  } catch (error) {
    console.error("Error deleting home banner:", error);
    return res.status(500).send("Internal Server Error");
  }
});

exports.HomeBannerEdit = catchAsyncErrors(async (req, res, next) => {
  const bannerId = req.params.bannerId;
  try {
    const admin = await Admin.findById(req.id);
    const homebanners = await HomeBanner.find();

    const banner = await HomeBanner.findById(bannerId);

    if (!banner) {
      req.flash("warning", "Home Banner not found");
      return res.redirect("/admin/add_home_banner");
    }
    res.render("backend/home_banner/edit_home_banner", {
      banner,
      admin,
      homebanners,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching home banner for edit:", error);
    return res.status(500).send("Internal Server Error");
  }
});

exports.HomeBannerUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    const bannerId = req.params.bannerId;
    const {
      status,
      publishdate,
      shortTitle1,
      shortTitle2,
      bigTitle1,
      bigTitle2,
      bannerURLName,
      bannerURL,
    } = req.body;

    const existingBanner = await HomeBanner.findById(bannerId);

    existingBanner.status = status;
    existingBanner.publishdate = publishdate;

    existingBanner.shortTitle1 = shortTitle1;
    existingBanner.shortTitle2 = shortTitle2;
    existingBanner.bigTitle1 = bigTitle1;
    existingBanner.bigTitle2 = bigTitle2;
    existingBanner.bannerURLName = bannerURLName;
    existingBanner.bannerURL = bannerURL;

    if (req.files && req.files.backgroundBanner) {
      const backgroundBannerFile = req.files.backgroundBanner;
      const modifiedFileName = `backgroundBanner-${Date.now()}${path.extname(
        backgroundBannerFile.name
      )}`;

      if (
        existingBanner.backgroundBanner &&
        existingBanner.backgroundBanner.fileId !== ""
      ) {
        await imagekit.deleteFile(existingBanner.backgroundBanner.fileId);
      }

      const { fileId, url } = await imagekit.upload({
        file: backgroundBannerFile.data,
        fileName: modifiedFileName,
      });

      existingBanner.backgroundBanner = {
        fileId,
        url,
      };
    }

    if (req.files && req.files.bannerImg) {
      const bannerImgFile = req.files.bannerImg;
      const modifiedFileName = `bannerImg-${Date.now()}${path.extname(
        bannerImgFile.name
      )}`;

      if (existingBanner.bannerImg && existingBanner.bannerImg.fileId !== "") {
        await imagekit.deleteFile(existingBanner.bannerImg.fileId);
      }

      const { fileId, url } = await imagekit.upload({
        file: bannerImgFile.data,
        fileName: modifiedFileName,
      });

      existingBanner.bannerImg = {
        fileId,
        url,
      };
    }

    await existingBanner.save();

    req.flash("success", "Home Banner Updated Successfully");
    res.redirect("/admin/add_home_banner");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred while updating the home banner");
    res.redirect("/admin/add_home_banner");
  }
});

// home banner end

// Products start

exports.AddProducts = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const subcategorys = await SubCategory.find();
    res.render("backend/products/add_products", {
      admin,
      subcategorys,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.ProductsAdd = catchAsyncErrors(async (req, res, next) => {
  try {
    const { subcategoryTitle, favcolor, colorname, ...productData } = req.body;

    const existingCategory = await SubCategory.findOne({ title: subcategoryTitle });

    if (!existingCategory) {
      return res.status(400).json({ error: "Selected category does not exist" });
    }

    const uploadImages = async (images) => {
      const imageDetails = [];

      for (const image of images) {
        const fileName = `productImage-${Date.now()}${path.extname(image.name)}`;
        const { fileId, url } = await imagekit.upload({
          file: image.data,
          fileName: fileName,
        });

        imageDetails.push({ fileId, url });
      }

      return imageDetails;
    };

    const productsImagesDetails = await uploadImages(req.files.productsImages);

    const colorsArray = []; // Initialize colors array

    // Add colorname and favcolor to the colors array
    if (Array.isArray(colorname) && Array.isArray(favcolor)) {
      // Assuming both arrays have the same length
      for (let i = 0; i < colorname.length; i++) {
        colorsArray.push({ colorname: colorname[i], favcolor: favcolor[i] });
      }
    } else if (typeof colorname === 'string' && typeof favcolor === 'string') {
      colorsArray.push({ colorname, favcolor });
    }

    const product = new Products({
      ...productData,
      productsImages: productsImagesDetails,
      productsColor: colorsArray, // Assign colors array to productsColor
      subcategories: [existingCategory._id],
    });

    await product.save();

    // Update SubCategory document to add the product ID
    existingCategory.allProducts.push(product._id);
    await existingCategory.save();

    res.redirect("/admin/products_list");
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

exports.add_productsColorImg = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const productId = req.params.id;
    const product = await Products.findById(productId);

    res.render("backend/products/add_productsColorImg", {
      admin,
      product,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.AddColorImagesToProduct = catchAsyncErrors(async (req, res, next) => {
  try {
    const productId = req.params.id;

    const existingProduct = await Products.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const uploadImages = async (images) => {
      const imageDetails = [];

      for (const image of images) {
        const fileName = `colorImage-${Date.now()}${path.extname(image.name)}`;
        const { fileId, url } = await imagekit.upload({
          file: image.data,
          fileName: fileName,
        });

        imageDetails.push({ fileId, url });
      }

      return imageDetails;
    };

    // Check if productsColorImages exists and is an array
    if (!req.files.productsColorImages) {
      return res.status(400).json({ error: "No color images uploaded" });
    }

    let colorImagesDetails = [];
    const favcolors = req.body.favcolor;
    const colornames = req.body.colorname;

    if (Array.isArray(req.files.productsColorImages)) {
      // Handle multiple color images
      colorImagesDetails = await uploadImages(req.files.productsColorImages);
    } else {
      // Handle single color image
      const image = req.files.productsColorImages;
      const fileName = `colorImage-${Date.now()}${path.extname(image.name)}`;
      const { fileId, url } = await imagekit.upload({
        file: image.data,
        fileName: fileName,
      });

      colorImagesDetails.push({ fileId, url });
    }

    // Create a single object for color and color name
    const favcolor = Array.isArray(favcolors) ? favcolors[0] : favcolors;
    const colorname = Array.isArray(colornames) ? colornames[0] : colornames;

    const colorObject = {
      favcolor,
      colorname,
      images: colorImagesDetails,
    };

    existingProduct.productsColorImages.push(colorObject);

    // Save the updated product
    await existingProduct.save();

    console.log("Color images added successfully to the existing product");
    res.redirect(`/admin/add_productsColorImg/${productId}`);
  } catch (error) {
    console.error("Error adding color images:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
  }
});

exports.ProductsList = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const products = await Products.find().populate("subcategories");
    res.render("backend/products/products_list", {
      admin,
      products,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.EditProducts = catchAsyncErrors(async (req, res, next) => {
  const ProductId = req.params.id;
  try {
    const admin = await Admin.findById(req.id);

    const products = await Products.find();

    const product = await Products.findById(ProductId).populate("subcategories");

    if (!product) {
      req.flash("warning", "Home Banner not found");
      return res.redirect("/admin/products_list");
    }
    res.render("backend/products/edit_products", {
      products,
      admin,
      product,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching home banner for edit:", error);
    return res.status(500).send("Internal Server Error");
  }
});

exports.ProductUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
      const productId = req.params.id;
      const { subcategoryTitle, productsImages, favcolor, colorname, ...updatedProductData } = req.body;

      // Find the subcategory based on the provided title
      const existingSubCategory = await SubCategory.findOne({ title: subcategoryTitle });

      // Check if the subcategory exists
      if (!existingSubCategory) {
          return res.status(400).json({ error: "Selected subcategory does not exist" });
      }

      const updatedProduct = { ...updatedProductData };

      // Array to hold updated images data
      let updatedImages = [];

      // Check if there are new images or if existing images need to be updated
      if (req.files && req.files.productsImages && req.files.productsImages.length > 0) {
          for (const image of req.files.productsImages) {
              const fileName = `productImage-${Date.now()}${path.extname(image.name)}`;
              const { fileId, url } = await imagekit.upload({
                  file: image.data,
                  fileName: fileName,
              });
              updatedImages.push({ fileId, url }); // Save new image data to the array
          }
      } else {
          // If no new images were uploaded, retain the existing images
          updatedImages = productsImages;
      }

      // Update colors if new colors are provided
      if (colorname && favcolor) {
          const colorsArray = colorname.map((color, index) => ({
              colorname: color,
              favcolor: favcolor[index],
          }));
          updatedProduct.productsColor = colorsArray;
      }

      // Update the existing product with updated fields, including updated images
      const updatedFields = {
          ...updatedProduct,
          productsImages: updatedImages // Update images in the updated fields
      };

      // Update the product in the database
      const updatedProductInDB = await Products.findByIdAndUpdate(productId, updatedFields, { new: true });

      console.log("Product updated successfully");

      res.redirect("/admin/products_list");
  } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: error.message,
      });
  }
});

exports.ProductView = catchAsyncErrors(async (req, res, next) => {
  const ProductId = req.params.id;
  try {
    const admin = await Admin.findById(req.id);
    const product = await Products.findById(ProductId).populate("subcategories").populate("productsRateReview");

    res.render("backend/products/products_view", {
      title: "Customers View",
      admin,
      product,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.rateReview = catchAsyncErrors(async (req, res, next) => {
  try {
    const { username, useremail, rate, review, productId } = req.body;
    const newRateReview = new RateReviews({
      username,
      useremail,
      rate,
      review,
      Product: productId,
    });

    await newRateReview.save();

    await Products.findByIdAndUpdate(productId, {
      $push: { productsRateReview: newRateReview._id },
    });

    res.redirect("back");
  } catch (error) {
    console.error("Error submitting rating and review:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit rating and review." });
  }
});

// Products end


// Coupon code start

exports.addCoupon = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
  const coupons = await Coupon.find()
    res.render("backend/marketing/add_coupon", {
      admin,
      coupons,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.CouponAdd = catchAsyncErrors(async (req, res, next) => {
  req.body.code = req.body.code.toUpperCase();
  const coupon = await new Coupon(req.body).save();
  res.redirect("/admin/add_coupon");
});

exports.updateCouponStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
      const updateQuery = { $set: { status } };

      const couponToUpdate = await Coupon.findOneAndUpdate(
          { _id: id },
          updateQuery,
          { new: true }
      );

      if (!couponToUpdate) {
          return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      return res.redirect("/admin/add_coupon");
  } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

exports.couponDelete = catchAsyncErrors(async (req, res, next) => {
  try {
    const couponId = req.params.id;

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);
    if (!deletedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.redirect("/admin/add_coupon")
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

exports.couponEdit = catchAsyncErrors(async (req, res, next) => {
  const CouponId = req.params.id;
  try {
    const admin = await Admin.findById(req.id);

    const coupon = await Coupon.findById(CouponId);

    if (!coupon) {
      req.flash("warning", "Coupon not found");
      return res.redirect("/admin/add_coupon");
    }
    res.render("backend/marketing/edit_coupon", {
      admin,
      coupon,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching Coupon for edit:", error);
    return res.status(500).send("Internal Server Error");
  }
});

exports.couponUpdate = catchAsyncErrors(async (req, res, next) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, req.body).exec();
    req.flash("success", "Coupon updated successfully");
    res.redirect("/admin/add_coupon");
  } catch (error) {
    console.error(error);
    req.flash("error", "Error updating category");
    res.redirect("/admin/add_coupon");
  }
});

exports.addShipping = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const shippings = await Shipping.find()
    res.render("backend/categories/add_shipping", {
      admin,
      shippings,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.ShippingAdd = catchAsyncErrors(async (req, res, next) => {
  try {
    const existingShipping = await Shipping.findOne();

    if (existingShipping) {
      existingShipping.price = req.body.price;
      existingShipping.status = req.body.status;
      await existingShipping.save();
    } else {
      await new Shipping(req.body).save();
    }

    res.redirect("/admin/add_shipping");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Coupon code end


// customers start

exports.customerList = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const users = await User.find().populate({
      path: "UserWishlists",
      populate: { path: "allProduct" },
    })
    .populate({
      path: "UserOrders",
      populate: {
        path: "orderProducts.item",
        model: "Product",
      },
    })
    .exec();

    res.render("backend/customers/customers_list", {
      title: "Customers List",
      admin,
      users,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/");
  }
});

exports.customerView = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  try {
    const admin = await Admin.findById(req.id);
    const user = await User.findById(userId).populate({
      path: "UserWishlists",
      populate: { path: "allProduct" },
    })
    .populate({
      path: "UserOrders",
      populate: {
        path: "orderProducts.item",
        model: "Product",
      },
    })
    .populate({
      path: "UserAddress",
    })
    .populate({
      path: "userRateReview",
      populate: {
        path: "Product",
      },
    })
    .exec();


    res.render("backend/customers/customer_view", {
      title: "Customers View",
      admin,
      user,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Oops! Something went wrong.");
    res.redirect("/admin/dashboard");
  }
});

exports.ordersList = catchAsyncErrors(async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.id);
    const orders = await Orders.find().populate({
      path: "user",
    })
    .populate({
      path: "onlinepayment",
    }).
    exec();

    res.render("backend/orders/orders_list", {
      title: "Orders List",
      admin,
      orders,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.oderView = catchAsyncErrors(async (req, res, next) => {
  const orderId = req.params.id;
  try {
    const admin = await Admin.findById(req.id);
    const order = await Orders.findById(orderId)
    .populate({
      path: "user",
    })
    .populate({
      path: "orderProducts.item",
      model: "Product",
    })
    .populate({
      path: "orderAddress",
    })
    .populate({
      path: "onlinepayment",
    })
    .exec();

    res.render("backend/orders/orders_view", {
      title: "Customers View",
      admin,
      order,
      messages: req.flash(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.orderStatusChange = catchAsyncErrors(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Find the order by ID and update its status
    await Orders.findByIdAndUpdate(orderId, { status: status });

    // Redirect back to the previous page
    res.redirect("back");
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

exports.orderDelete = catchAsyncErrors(async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await Orders.findById(orderId);

    if (!order) {
      throw new ErrorHandler("Order not found", 404);
    }

    await User.findByIdAndUpdate(order.user, { $pull: { UserOrders: orderId } });

    await Orders.findByIdAndDelete(orderId);

    req.flash("warning", "Order deleted successfully");
    
    res.redirect("back");
  } catch (err) {
    // Pass the error to the error handling middleware
    return next(err);
  }
});


// customers  end


