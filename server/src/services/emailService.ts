import nodemailer from 'nodemailer';

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    console.warn('[EmailService] EMAIL_USER or EMAIL_PASSWORD not configured. Emails will be logged but not sent.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

const getFromAddress = () => {
  return process.env.EMAIL_FROM || `SmartFoodRescue <${process.env.EMAIL_USER || 'no-reply@smartfoodrescue.org'}>`;
};

// Base HTML layout for consistent, professional styling
const wrapEmailTemplate = (title: string, bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #166534; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; font-size: 13px; }
    .value { color: #0f172a; font-weight: 600; font-size: 13px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-weight: 600; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartFoodRescue</h1>
      <p>Real-Time Surplus Food Redistribution Network</p>
    </div>
    <div class="content">
      <h2 style="font-size: 16px; color: #166534; margin-top: 0;">${title}</h2>
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0;">SmartFoodRescue Civic Initiative &bull; Reducing Food Waste, Eliminating Hunger</p>
      <p style="margin: 4px 0 0 0;">This is an automated system notification.</p>
    </div>
  </div>
</body>
</html>
`;

export interface RequestPlacedEmailData {
  to: string | string[];
  requestId: string;
  foodType: string;
  quantity: number | string;
  unit?: string;
  donorName: string;
  ngoName: string;
  pickupLocation: string;
  status: string;
  expectedPickupInfo?: string;
}

export const sendRequestPlacedEmail = async (data: RequestPlacedEmailData): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;

    const unit = data.unit || 'portions';
    const bodyContent = `
      <p>A new food rescue request has been placed on the SmartFoodRescue platform.</p>
      <div class="card">
        <div class="row"><span class="label">Request / Donation ID:</span><span class="value">#${data.requestId.slice(-6).toUpperCase()}</span></div>
        <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
        <div class="row"><span class="label">Quantity Requested:</span><span class="value">${data.quantity} ${unit}</span></div>
        <div class="row"><span class="label">Donor:</span><span class="value">${data.donorName}</span></div>
        <div class="row"><span class="label">Requesting NGO:</span><span class="value">${data.ngoName}</span></div>
        <div class="row"><span class="label">Pickup Location:</span><span class="value">${data.pickupLocation}</span></div>
        <div class="row"><span class="label">Status:</span><span class="value"><span class="badge">${data.status}</span></span></div>
        ${data.expectedPickupInfo ? `<div class="row"><span class="label">Pickup Note:</span><span class="value">${data.expectedPickupInfo}</span></div>` : ''}
      </div>
      <p>Please log in to your dashboard to review and manage this rescue operation.</p>
    `;

    const html = wrapEmailTemplate('Food Rescue Request Placed', bodyContent);
    const recipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;

    await transporter.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: 'SmartFoodRescue - Food Rescue Request Placed',
      text: `SmartFoodRescue: Request placed for ${data.foodType} (${data.quantity} ${unit}) by ${data.ngoName}. Request ID: #${data.requestId.slice(-6)}`,
      html,
    });

    console.log(`[EmailService] Request placed email sent to: ${recipients}`);
    return true;
  } catch (error: any) {
    console.error('[EmailService] Failed to send request placed email:', error?.message || error);
    return false;
  }
};

export interface DeliveredEmailData {
  to: string | string[];
  pickupId: string;
  foodType: string;
  quantity: number | string;
  unit?: string;
  donorName: string;
  ngoName: string;
  volunteerName: string;
  deliveryDate?: Date | string;
  pickupLocation?: string;
  deliveryLocation?: string;
}

export const sendDeliveredEmail = async (data: DeliveredEmailData): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;

    const unit = data.unit || 'portions';
    const deliveryTimeStr = data.deliveryDate ? new Date(data.deliveryDate).toLocaleString() : new Date().toLocaleString();

    const bodyContent = `
      <p>Good news! The surplus food donation has been safely transported and delivered to the recipient NGO.</p>
      <div class="card">
        <div class="row"><span class="label">Pickup ID:</span><span class="value">#${data.pickupId.slice(-6).toUpperCase()}</span></div>
        <div class="row"><span class="label">Food Rescued:</span><span class="value">${data.foodType}</span></div>
        <div class="row"><span class="label">Quantity Delivered:</span><span class="value">${data.quantity} ${unit}</span></div>
        <div class="row"><span class="label">Donor:</span><span class="value">${data.donorName}</span></div>
        <div class="row"><span class="label">Receiving NGO:</span><span class="value">${data.ngoName}</span></div>
        <div class="row"><span class="label">Transported By:</span><span class="value">${data.volunteerName}</span></div>
        <div class="row"><span class="label">Delivery Status:</span><span class="value"><span class="badge">DELIVERED</span></span></div>
        <div class="row"><span class="label">Delivery Time:</span><span class="value">${deliveryTimeStr}</span></div>
        ${data.deliveryLocation ? `<div class="row"><span class="label">NGO Facility:</span><span class="value">${data.deliveryLocation}</span></div>` : ''}
      </div>
      <p>The NGO can now proceed with community distribution. Thank you for making a tangible difference!</p>
    `;

    const html = wrapEmailTemplate('Food Delivered Successfully', bodyContent);
    const recipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;

    await transporter.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: 'SmartFoodRescue - Food Delivered Successfully',
      text: `SmartFoodRescue: Food (${data.foodType}, ${data.quantity} ${unit}) successfully delivered to ${data.ngoName} by volunteer ${data.volunteerName}. Pickup ID: #${data.pickupId.slice(-6)}`,
      html,
    });

    console.log(`[EmailService] Delivery email sent to: ${recipients}`);
    return true;
  } catch (error: any) {
    console.error('[EmailService] Failed to send delivered email:', error?.message || error);
    return false;
  }
};

export interface DistributedEmailData {
  to: string | string[];
  distributionId: string;
  foodType: string;
  quantityDistributed: number | string;
  unit?: string;
  ngoName: string;
  beneficiaryCount?: number | string;
  distributionDate?: Date | string;
  notes?: string;
}

export const sendDistributedEmail = async (data: DistributedEmailData): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    if (!transporter) return false;

    const unit = data.unit || 'portions';
    const distDateStr = data.distributionDate ? new Date(data.distributionDate).toLocaleString() : new Date().toLocaleString();

    const bodyContent = `
      <p>The food rescue cycle is now complete! The donated food has been successfully distributed to community beneficiaries.</p>
      <div class="card">
        <div class="row"><span class="label">Distribution ID:</span><span class="value">#${data.distributionId.slice(-6).toUpperCase()}</span></div>
        <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
        <div class="row"><span class="label">Quantity Distributed:</span><span class="value">${data.quantityDistributed} ${unit}</span></div>
        <div class="row"><span class="label">Distributing NGO:</span><span class="value">${data.ngoName}</span></div>
        ${data.beneficiaryCount ? `<div class="row"><span class="label">People / Beneficiaries Fed:</span><span class="value" style="color: #166534; font-weight: 700;">${data.beneficiaryCount}</span></div>` : ''}
        <div class="row"><span class="label">Distribution Date:</span><span class="value">${distDateStr}</span></div>
        <div class="row"><span class="label">Final Status:</span><span class="value"><span class="badge">DISTRIBUTED</span></span></div>
        ${data.notes ? `<div class="row"><span class="label">Field Notes:</span><span class="value">${data.notes}</span></div>` : ''}
      </div>
      <p>Thank you to all stakeholders for turning surplus food into warm meals and community impact!</p>
    `;

    const html = wrapEmailTemplate('Food Distributed Successfully', bodyContent);
    const recipients = Array.isArray(data.to) ? data.to.join(', ') : data.to;

    await transporter.sendMail({
      from: getFromAddress(),
      to: recipients,
      subject: 'SmartFoodRescue - Food Distributed Successfully',
      text: `SmartFoodRescue: Food (${data.foodType}) successfully distributed by ${data.ngoName} to ${data.beneficiaryCount || 'community'} beneficiaries. Distribution ID: #${data.distributionId.slice(-6)}`,
      html,
    });

    console.log(`[EmailService] Distribution email sent to: ${recipients}`);
    return true;
  } catch (error: any) {
    console.error('[EmailService] Failed to send distributed email:', error?.message || error);
    return false;
  }
};
