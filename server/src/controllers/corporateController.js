const CorporateLead = require('../models/CorporateLead');

exports.submitCorporateLead = async (req, res) => {
  try {
    const { companyName, contactName, email, phone, propertyType, numberOfUnits, servicesInterested, message } = req.body;

    if (!companyName || !email || !phone) {
      return res.status(400).json({ message: 'Company name, email, and phone are required.' });
    }

    const lead = await CorporateLead.create({
      companyName, contactName, email, phone, propertyType, numberOfUnits, servicesInterested, message
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry received. Our B2B team will contact you within 24 hours.',
      data: lead
    });
  } catch (error) {
    console.error('Corporate Lead Error:', error);
    res.status(500).json({ message: 'Server error while submitting inquiry.' });
  }
};