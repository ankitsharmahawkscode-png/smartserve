const mongoose = require('mongoose');

const corporateLeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  propertyType: { 
    type: String, 
    required: true,
    enum: ['Office', 'Co-working Space', 'Apartment Complex', 'Retail Store', 'Other'] 
  },
  numberOfUnits: { type: Number, required: true },
  servicesInterested: [{ type: String }],
  message: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Proposal Sent', 'Closed', 'Lost'], 
    default: 'New' 
  }
}, { timestamps: true });

module.exports = mongoose.model('CorporateLead', corporateLeadSchema);