const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Air Conditioners', 'Washing Machines', 'Refrigerators', 'Microwaves', 'Other']
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  image: { type: String, required: true }, // URL to image
  features: [{ type: String }],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }, // To hide/show products without deleting
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);