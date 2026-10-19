const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

// --- ADMIN ---
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  ok(res, { coupon }, 'Coupon created', 201);
});

exports.listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  ok(res, { items: coupons });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  ok(res, null, 'Coupon deleted');
});

// --- PUBLIC (Validate & Calculate) ---
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');
  if (new Date() > coupon.expiryDate) throw new ApiError(400, 'Coupon has expired');
  if (coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');
  if (amount < coupon.minBookingAmount) {
    throw new ApiError(400, `Minimum booking amount for this coupon is ₹${coupon.minBookingAmount}`);
  }

  let discount = 0;
  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else {
    discount = (amount * coupon.discountValue) / 100;
  }

  if (discount > amount) discount = amount;

  ok(res, { 
    code: coupon.code, 
    discount, 
    finalAmount: amount - discount,
    message: `Coupon applied! You saved ₹${discount}`
  });
});