import nodemailer from 'nodemailer';

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || 'unknown';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`;
  }
  const start = localPart.slice(0, 2);
  const end = localPart.slice(-1);
  return `${start}***${end}@${domain}`;
};

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';

  if (!user || !pass) {
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

export const getFromAddress = () => {
  return process.env.EMAIL_FROM || `SmartFoodRescue <${process.env.EMAIL_USER || 'smartfoodrescue1@gmail.com'}>`;
};

export const verifyEmailConfig = async (): Promise<boolean> => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    console.warn('[EmailService] SMTP credentials not fully configured (EMAIL_USER or EMAIL_PASSWORD missing). Emails will be skipped safely.');
    return false;
  }

  try {
    const transporter = getTransporter();
    if (!transporter) return false;
    await transporter.verify();
    console.log(`[EmailService] SMTP configuration verified successfully (User: ${maskEmail(user)})`);
    return true;
  } catch (error: any) {
    console.error(`[EmailService] SMTP configuration verification failed: ${error?.message || error}`);
    return false;
  }
};

// Base HTML layout for consistent, professional styling
export const wrapEmailTemplate = (title: string, bodyContent: string) => `
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

export const sendEmailSafe = async (options: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const validRecipients = Array.from(new Set(recipients.map(r => (r || '').trim()).filter(Boolean)));
    if (validRecipients.length === 0) {
      console.warn('[EmailService] No valid recipient email provided.');
      return false;
    }

    const maskedRecipients = validRecipients.map(maskEmail).join(', ');

    if (!transporter) {
      console.log(`[EmailService] [Notice] Transporter not configured. Email preview: "${options.subject}" to: ${maskedRecipients}`);
      return false;
    }

    await transporter.sendMail({
      from: getFromAddress(),
      to: validRecipients.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent successfully to: ${maskedRecipients}`);
    return true;
  } catch (error: any) {
    console.error(`Email sending failed: ${error?.message || error}`);
    return false;
  }
};

// ==========================================
// 1. DONOR EMAIL FLOW: Food Donation Created
// ==========================================
export interface DonationCreatedEmailData {
  to: string | string[];
  donorName: string;
  donationId: string;
  foodType: string;
  foodCategory?: string;
  quantity: number | string;
  unit?: string;
  pickupLocation: string;
  preparationTime?: Date | string;
  expiryTime: Date | string;
  status?: string;
}

export const sendDonationCreatedEmail = async (data: DonationCreatedEmailData): Promise<boolean> => {
  const unit = data.unit || 'kg';
  const prepStr = data.preparationTime ? new Date(data.preparationTime).toLocaleString() : 'Just Prepared';
  const expStr = data.expiryTime ? new Date(data.expiryTime).toLocaleString() : 'N/A';
  const status = data.status || 'AVAILABLE';

  const bodyContent = `
    <p>Dear ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Your food donation request has been submitted successfully.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
      ${data.foodCategory ? `<div class="row"><span class="label">Category:</span><span class="value">${data.foodCategory}</span></div>` : ''}
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">Pickup / Location:</span><span class="value">${data.pickupLocation}</span></div>
      <div class="row"><span class="label">Current Status:</span><span class="value"><span class="badge">${status}</span></span></div>
      <div class="row"><span class="label">Date / Time:</span><span class="value">${prepStr}</span></div>
      ${data.expiryTime ? `<div class="row"><span class="label">Expiry Time:</span><span class="value">${expStr}</span></div>` : ''}
    </div>
    <p>We will notify you via email as soon as an NGO accepts your donation request.</p>
  `;

  const html = wrapEmailTemplate('Food Donation Request Submitted', bodyContent);
  const text = `Dear ${data.donorName},\n\nYour food donation request has been submitted successfully.\n\nDonation Details:\n- Donation ID: ${data.donationId}\n- Food Type: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- Pickup/Location: ${data.pickupLocation}\n- Current Status: ${status}\n- Date/Time: ${prepStr}`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Request Submitted - SmartFoodRescue',
    text,
    html,
  });
};

// ==========================================
// 2. NGO ACCEPTANCE EMAIL FLOW
// ==========================================
export interface NgoAcceptanceEmailData {
  to: string | string[];
  donorName: string;
  donationId: string;
  foodType: string;
  quantity: number | string;
  unit?: string;
  ngoName: string;
  pickupLocation?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  status?: string;
}

export const sendNgoAcceptanceEmail = async (data: NgoAcceptanceEmailData): Promise<boolean> => {
  const unit = data.unit || 'portions';
  const status = data.status || 'ACCEPTED';

  const bodyContent = `
    <p>Dear ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Your food donation request has been accepted by an NGO and the pickup process has started.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">NGO Name:</span><span class="value">${data.ngoName}</span></div>
      <div class="row"><span class="label">Food Details:</span><span class="value">${data.foodType}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      ${data.pickupLocation ? `<div class="row"><span class="label">Pickup Information:</span><span class="value">${data.pickupLocation}</span></div>` : ''}
      ${data.volunteerName ? `<div class="row"><span class="label">Assigned Volunteer:</span><span class="value">${data.volunteerName} ${data.volunteerPhone ? `(${data.volunteerPhone})` : ''}</span></div>` : ''}
      <div class="row"><span class="label">Current Status:</span><span class="value"><span class="badge">${status}</span></span></div>
    </div>
    <p>Please keep the surplus food packaged and ready for safe handover. You can monitor the live rescue timeline on your dashboard.</p>
  `;

  const html = wrapEmailTemplate('Food Donation Request Accepted', bodyContent);
  const text = `Dear ${data.donorName},\n\nYour food donation request has been accepted by an NGO and the pickup process has started.\n\nDonation Details:\n- Donation ID: ${data.donationId}\n- NGO Name: ${data.ngoName}\n- Food Details: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- Pickup Information: ${data.pickupLocation || 'On file'}\n- Current Status: ${status}`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Request Accepted - SmartFoodRescue',
    text,
    html,
  });
};

// ==========================================
// 3. VOLUNTEER STATUS EMAILS
// ==========================================
export interface VolunteerStatusEmailData {
  to: string | string[];
  donorName: string;
  donationId: string;
  foodType: string;
  quantity: number | string;
  unit?: string;
  ngoName: string;
  volunteerName?: string;
  volunteerPhone?: string;
  status: 'ASSIGNED' | 'RECEIVED' | 'DISPATCHED' | 'DELIVERED' | 'DISTRIBUTED' | string;
  pickupLocation?: string;
  deliveryLocation?: string;
  notes?: string;
}

export const sendVolunteerStatusEmail = async (data: VolunteerStatusEmailData): Promise<boolean> => {
  const unit = data.unit || 'portions';
  let subject = `Food Donation Status Updated: ${data.status} - SmartFoodRescue`;
  let title = `Donation Status: ${data.status}`;
  let statusDescription = `Your food donation status has changed to ${data.status}.`;

  if (data.status === 'ASSIGNED') {
    subject = 'Volunteer Assigned for Food Pickup - SmartFoodRescue';
    title = 'Volunteer Assigned for Pickup';
    statusDescription = `A volunteer (${data.volunteerName || 'Fleet Volunteer'}) has been assigned to pick up your food donation for ${data.ngoName}.`;
  } else if (data.status === 'RECEIVED') {
    subject = 'Food Donation Picked Up by Volunteer - SmartFoodRescue';
    title = 'Food Picked Up by Volunteer';
    statusDescription = `The volunteer has arrived and securely picked up the food donation from your pickup location.`;
  } else if (data.status === 'DISPATCHED') {
    subject = 'Food Donation In Transit - SmartFoodRescue';
    title = 'Food Donation In Transit';
    statusDescription = `The food donation is currently in transit to ${data.ngoName}.`;
  } else if (data.status === 'DELIVERED') {
    subject = 'Food Donation Delivered Successfully - SmartFoodRescue';
    title = 'Food Donation Delivered Successfully';
    statusDescription = `The food donation has been safely transported and delivered to the recipient NGO (${data.ngoName}).`;
  } else if (data.status === 'DISTRIBUTED') {
    subject = 'Food Donation Successfully Distributed - SmartFoodRescue';
    title = 'Food Donation Successfully Distributed';
    statusDescription = `The food rescue cycle is now complete! The food has been served to community beneficiaries by ${data.ngoName}.`;
  }

  const bodyContent = `
    <p>Dear ${data.donorName},</p>
    <p style="font-size: 14px; font-weight: 500; color: #1e293b;">${statusDescription}</p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId.slice(-6).toUpperCase()}</span></div>
      <div class="row"><span class="label">Food Item:</span><span class="value">${data.foodType}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">Partner NGO:</span><span class="value">${data.ngoName}</span></div>
      ${data.volunteerName ? `<div class="row"><span class="label">Volunteer:</span><span class="value">${data.volunteerName} ${data.volunteerPhone ? `(${data.volunteerPhone})` : ''}</span></div>` : ''}
      <div class="row"><span class="label">Current Status:</span><span class="value"><span class="badge">${data.status}</span></span></div>
      ${data.pickupLocation ? `<div class="row"><span class="label">Pickup Location:</span><span class="value">${data.pickupLocation}</span></div>` : ''}
      ${data.deliveryLocation ? `<div class="row"><span class="label">Delivery Location:</span><span class="value">${data.deliveryLocation}</span></div>` : ''}
      ${data.notes ? `<div class="row"><span class="label">Notes:</span><span class="value">${data.notes}</span></div>` : ''}
    </div>
    <p>Thank you for contributing to hunger relief and food rescue with SmartFoodRescue!</p>
  `;

  const html = wrapEmailTemplate(title, bodyContent);
  const text = `Dear ${data.donorName},\n\n${statusDescription}\nDonation ID: #${data.donationId.slice(-6)}\nFood: ${data.foodType} (${data.quantity} ${unit})\nStatus: ${data.status}\nNGO: ${data.ngoName}`;

  return sendEmailSafe({
    to: data.to,
    subject,
    text,
    html,
  });
};

// ==========================================
// 4. Legacy and Existing Call Compatibility
// ==========================================
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
  return sendEmailSafe({
    to: data.to,
    subject: 'SmartFoodRescue - Food Rescue Request Placed',
    text: `SmartFoodRescue: Request placed for ${data.foodType} (${data.quantity} ${unit}) by ${data.ngoName}. Request ID: #${data.requestId.slice(-6)}`,
    html,
  });
};

export interface DeliveredEmailData {
  to: string | string[];
  donationId: string;
  foodType: string;
  quantity: number | string;
  unit?: string;
  donorName: string;
  ngoName: string;
  volunteerName?: string;
  deliveryDate?: Date | string;
  pickupLocation?: string;
  deliveryLocation?: string;
}

export const sendDeliveredEmail = async (data: DeliveredEmailData): Promise<boolean> => {
  const unit = data.unit || 'portions';
  const deliveryTimeStr = data.deliveryDate ? new Date(data.deliveryDate).toLocaleString() : new Date().toLocaleString();

  const bodyContent = `
    <p>Dear ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Your donated food has been delivered successfully. Thank you for helping reduce food waste and feed people in need.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">NGO Name:</span><span class="value">${data.ngoName}</span></div>
      ${data.volunteerName ? `<div class="row"><span class="label">Volunteer / Pickup Info:</span><span class="value">${data.volunteerName}</span></div>` : ''}
      <div class="row"><span class="label">Delivery Date / Time:</span><span class="value">${deliveryTimeStr}</span></div>
      <div class="row"><span class="label">Final Status:</span><span class="value"><span class="badge">DELIVERED</span></span></div>
      ${data.deliveryLocation ? `<div class="row"><span class="label">Destination Facility:</span><span class="value">${data.deliveryLocation}</span></div>` : ''}
    </div>
    <p>Thank you for making a tangible difference in our community!</p>
  `;

  const html = wrapEmailTemplate('Food Donation Delivered Successfully', bodyContent);
  const text = `Dear ${data.donorName},\n\nYour donated food has been delivered successfully. Thank you for helping reduce food waste and feed people in need.\n\nDetails:\n- Donation ID: ${data.donationId}\n- Food Type: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- NGO Name: ${data.ngoName}\n${data.volunteerName ? `- Volunteer: ${data.volunteerName}\n` : ''}- Delivery Date/Time: ${deliveryTimeStr}\n- Final Status: DELIVERED`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Delivered Successfully - SmartFoodRescue',
    text,
    html,
  });
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
  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Successfully Distributed - SmartFoodRescue',
    text: `SmartFoodRescue: Food (${data.foodType}) successfully distributed by ${data.ngoName} to ${data.beneficiaryCount || 'community'} beneficiaries. Distribution ID: #${data.distributionId.slice(-6)}`,
    html,
  });
};
