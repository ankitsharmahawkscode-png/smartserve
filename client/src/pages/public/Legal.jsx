import LegalPage from '../../components/LegalPage.jsx';
import { company } from '../../content.js';

// ===== BUSINESS DETAILS: edit these =====
const NAME = company?.name || 'Technical Workers';
const EMAIL = company?.email || 'support@yourdomain.com';
const PHONE = company?.phone || '+91 00000 00000';
const ADDRESS = company?.address || 'Your registered business address';
const CITY = 'your city';                 // used for the courts clause in the Terms
const FREE_CANCEL_HOURS = 4;              // same as Settings > "free cancellation hours before"
const FEE_PERCENT = 20;                   // same as Settings > "cancellation fee percent"
const REFUND_DAYS = '5 to 7 working days';
const UPDATED = 'November 3, 2026';
// ========================================

export function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`How ${NAME} collects, uses and protects your personal information.`}
      path="/privacy-policy"
      updated={UPDATED}
      intro={`${NAME} ("we", "us") respects your privacy. This policy explains what information we collect when you use our website and book home services, how we use it, and the choices you have.`}
      sections={[
        {
          id: 'collect',
          heading: 'Information we collect',
          body: [
            'We collect only what we need to provide our services:',
            { list: [
              'Account details: your name, email address, phone number and password (stored in encrypted form).',
              'Booking details: the service you choose, date and time slot, service address and any notes you add.',
              'Payment details: for online payments, the payment is handled by Razorpay. We receive a payment reference and status, never your full card, UPI PIN or net-banking details.',
              'Messages you send us through the contact form, and the details in a technician application.',
              'Technical data such as browser type, device and pages visited, collected through cookies and similar tools.',
            ] },
          ],
        },
        {
          id: 'use',
          heading: 'How we use your information',
          body: [
            { list: [
              'To create your account, process bookings and assign a technician.',
              'To send booking confirmations, status updates, receipts and refund notices by email.',
              'To process payments and refunds.',
              'To respond to your questions and support requests.',
              'To prevent fraud, keep the service secure and meet legal obligations.',
              'To improve our website and services.',
            ] },
            'We do not sell your personal information.',
          ],
        },
        {
          id: 'share',
          heading: 'Who we share it with',
          body: [
            { list: [
              'The technician assigned to your booking, who sees your name, phone number, address and job details so they can reach you and do the work.',
              'Razorpay, to process online payments and refunds.',
              'Email and hosting providers that help us run the service, under confidentiality terms.',
              'Authorities or courts, when the law requires it.',
            ] },
          ],
        },
        {
          id: 'cookies',
          heading: 'Cookies',
          body: [
            'We use cookies and local storage to keep you logged in, remember your preferences and understand how the site is used. You can block or delete cookies in your browser settings, but parts of the site may then stop working.',
          ],
        },
        {
          id: 'retention',
          heading: 'How long we keep your data',
          body: [
            'We keep account and booking records for as long as your account is active and for the period needed to meet accounting, tax and legal requirements. You can ask us to delete your account at any time (see Your rights).',
          ],
        },
        {
          id: 'security',
          heading: 'Security',
          body: [
            'We use encryption in transit, hashed passwords and access controls to protect your data. No online service is completely risk free, so please choose a strong password and keep it private.',
          ],
        },
        {
          id: 'rights',
          heading: 'Your rights',
          body: [
            'You may ask us to access, correct or delete your personal information, or withdraw your consent to its use, by writing to us at the address below. We will respond within a reasonable time. Some records may have to be kept where the law requires it.',
          ],
        },
        {
          id: 'children',
          heading: "Children's privacy",
          body: [`Our services are meant for adults. We do not knowingly collect information from children under 18.`],
        },
        {
          id: 'changes',
          heading: 'Changes to this policy',
          body: ['We may update this policy from time to time. The "Last updated" date at the top shows the latest version.'],
        },
        {
          id: 'contact',
          heading: 'Contact and grievances',
          body: [
            'For privacy questions or complaints, contact our grievance contact:',
            { list: [`Email: ${EMAIL}`, `Phone: ${PHONE}`, `Address: ${ADDRESS}`] },
          ],
        },
      ]}
    />
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms & Conditions"
      description={`The terms that apply when you use ${NAME} to book home services.`}
      path="/terms"
      updated={UPDATED}
      intro={`By creating an account or booking a service on ${NAME}, you agree to these terms. Please read them carefully.`}
      sections={[
        {
          id: 'service',
          heading: 'Our service',
          body: [
            `${NAME} is an online platform that lets you book home services such as AC repair, plumbing, electrical work, cleaning and appliance repair from verified technicians.`,
          ],
        },
        {
          id: 'account',
          heading: 'Your account',
          body: [
            { list: [
              'You must give accurate information and keep your login details private.',
              'You are responsible for activity under your account.',
              'We may suspend an account that is used for fraud, abuse or in breach of these terms.',
            ] },
          ],
        },
        {
          id: 'booking',
          heading: 'Bookings',
          body: [
            'A booking is confirmed only after we approve it. Time slots are subject to technician availability, and we may offer another slot if needed.',
            'Please make sure someone is available at the address during the slot and that the technician can safely reach the work area.',
          ],
        },
        {
          id: 'pricing',
          heading: 'Pricing and payment',
          body: [
            { list: [
              'Some services have a fixed price. Others are estimates, and the final amount is set after the technician inspects the job and is shown to you.',
              'Spare parts and extra work are charged only after they are explained to you.',
              'You can pay online through Razorpay or, where offered, in cash after the job.',
              'Prices include taxes unless stated otherwise.',
            ] },
          ],
        },
        {
          id: 'cancellation',
          heading: 'Cancellation and refunds',
          body: ['Cancellations and refunds are governed by our Refund & Cancellation Policy, which forms part of these terms.'],
        },
        {
          id: 'conduct',
          heading: 'Conduct',
          body: [
            'We expect respectful behaviour from customers and technicians. Abuse, harassment or unsafe conditions may lead to the job being stopped, with charges applying for the visit.',
          ],
        },
        {
          id: 'liability',
          heading: 'Limits of liability',
          body: [
            'We take reasonable care in selecting technicians, but the work is carried out at your premises. To the fullest extent the law allows, we are not liable for indirect or consequential losses, and our total liability for any booking is limited to the amount you paid for it. Nothing here limits any right you have under consumer protection law.',
          ],
        },
        {
          id: 'ip',
          heading: 'Our content',
          body: ['The website, logo and content belong to us. You may not copy or reuse them without our written permission.'],
        },
        {
          id: 'law',
          heading: 'Governing law',
          body: [`These terms are governed by the laws of India. Courts in ${CITY} have jurisdiction over any dispute, subject to your rights under applicable consumer law.`],
        },
        {
          id: 'contact',
          heading: 'Contact',
          body: [{ list: [`Email: ${EMAIL}`, `Phone: ${PHONE}`, `Address: ${ADDRESS}`] }],
        },
      ]}
    />
  );
}

export function RefundPolicy() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      description={`How cancellations and refunds work at ${NAME}.`}
      path="/refund-policy"
      updated={UPDATED}
      intro="We want cancelling to be simple and fair. This page explains when a cancellation is free, when a fee applies and how refunds are paid."
      sections={[
        {
          id: 'customer',
          heading: 'Cancelling a booking',
          body: [
            'You can cancel from My bookings in your dashboard while the booking is Pending, Confirmed, Assigned or Accepted. Once work has started, the booking can no longer be cancelled online.',
            { list: [
              `Free cancellation: cancel at least ${FREE_CANCEL_HOURS} hours before the start of your slot and you pay nothing.`,
              `Late cancellation: if you cancel less than ${FREE_CANCEL_HOURS} hours before the slot, a fee of ${FEE_PERCENT}% of the booking amount applies. This covers the technician's time and travel.`,
            ] },
          ],
        },
        {
          id: 'ours',
          heading: 'If we cancel',
          body: [
            'If we cannot provide a technician or have to cancel for any reason, you will not be charged, and any online payment is refunded in full.',
          ],
        },
        {
          id: 'online',
          heading: 'Refunds for online payments',
          body: [
            `Eligible refunds are sent to the original payment method through Razorpay. After we process the refund it reaches your account in ${REFUND_DAYS}, depending on your bank. The refund amount is the amount you paid minus any cancellation fee.`,
          ],
        },
        {
          id: 'cash',
          heading: 'Cash payments',
          body: ['If you pay in cash after the job, nothing is collected for a cancelled booking, except any late cancellation fee that applies.'],
        },
        {
          id: 'service-issue',
          heading: 'Problems with completed work',
          body: [
            'If you are unhappy with a completed job, tell us within 48 hours through the contact page with your booking number. We will review the issue and, where appropriate, send a technician to correct it or refund part or all of the amount.',
          ],
        },
        {
          id: 'not-covered',
          heading: 'When refunds are not given',
          body: [
            { list: [
              'The technician arrived but could not do the job because no one was available at the address.',
              'The job was completed as agreed and no fault was found in the work.',
              'Charges for spare parts that were already used or ordered for your job.',
            ] },
          ],
        },
        {
          id: 'contact',
          heading: 'Contact us',
          body: ['For help with a refund, write to us with your booking number:', { list: [`Email: ${EMAIL}`, `Phone: ${PHONE}`] }],
        },
      ]}
    />
  );
}