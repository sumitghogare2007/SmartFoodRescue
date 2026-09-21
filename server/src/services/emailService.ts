import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';

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

export interface SmtpTransportConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS?: boolean;
}

export const sanitizeError = (err: any): string => {
  if (!err) return 'Unknown error';
  const msg = typeof err === 'string' ? err : (err.message || err.name || err.code || JSON.stringify(err));
  const resendKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  const emailPass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.trim() : '';
  const mongoUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';
  const jwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';

  let safe = msg;
  if (resendKey && resendKey.length > 5) safe = safe.split(resendKey).join('[REDACTED_API_KEY]');
  if (emailPass && emailPass.length > 3) safe = safe.split(emailPass).join('[REDACTED_PASSWORD]');
  if (mongoUri && mongoUri.length > 5) safe = safe.split(mongoUri).join('[REDACTED_URI]');
  if (jwtSecret && jwtSecret.length > 3) safe = safe.split(jwtSecret).join('[REDACTED_SECRET]');
  return safe;
};

// Resend Client Initialization (reads key only from process.env.RESEND_API_KEY)
let resendClient: Resend | null = null;

export const getResendClient = (): Resend | null => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  if (!resendClient) {
    console.log('[EmailService] Resend configuration detected');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

export const isResendConfigured = (): boolean => {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
};

const getSmtpCredentials = () => {
  const user = (process.env.EMAIL_USER || 'smartfoodrescue1@gmail.com').trim();
  const pass = process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.replace(/\s+/g, '').trim() : '';
  return { user, pass };
};

const getTargetHost = () => (process.env.SMTP_HOST || 'smtp.gmail.com').trim();

export const config465: SmtpTransportConfig = {
  host: getTargetHost(),
  port: 465,
  secure: true,
};

export const config587: SmtpTransportConfig = {
  host: getTargetHost(),
  port: 587,
  secure: false,
  requireTLS: true,
};

let activeConfig: SmtpTransportConfig = config465;
let activeTransporter: Transporter | null = null;
let lastVerificationResult: string = 'PENDING';
let lastErrorCodeMessage: string | null = null;
let lastSendResult: string | null = null;

export const getEmailDiagnostics = () => {
  const resendActive = isResendConfigured();
  return {
    provider: resendActive ? 'Resend API' : 'SMTP',
    resendConfigured: resendActive,
    senderConfigured: getFromAddress(),
    smtpHost: activeConfig.host,
    smtpPort: activeConfig.port,
    smtpSecureSetting: activeConfig.secure,
    requireTLS: activeConfig.requireTLS || false,
    smtpConfigurationDetected: `host: ${activeConfig.host}, port: ${activeConfig.port}, secure: ${activeConfig.secure}${activeConfig.requireTLS ? ', requireTLS: true' : ''}`,
    verificationResult: lastVerificationResult,
    errorCodeMessage: lastErrorCodeMessage,
    emailSendResult: lastSendResult,
  };
};

export const getSmtpDiagnostics = getEmailDiagnostics;

export const createTransporterForConfig = (config: SmtpTransportConfig): Transporter | null => {
  const { user, pass } = getSmtpCredentials();
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
};

export const getTransporter = (): Transporter | null => {
  if (!activeTransporter) {
    activeTransporter = createTransporterForConfig(activeConfig);
  }
  return activeTransporter;
};

export const getFromAddress = (): string => {
  const rawFrom = (process.env.EMAIL_FROM || process.env.RESEND_FROM || '').trim();
  if (rawFrom) {
    if (rawFrom.includes('<') && rawFrom.includes('>')) {
      return rawFrom;
    }
    return `SmartFoodRescue <${rawFrom}>`;
  }
  // Default intended sender identity if EMAIL_FROM is not provided
  return 'SmartFoodRescue <smartfood1@gmail.com>';
};

export const verifyEmailConfig = async (): Promise<boolean> => {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendApiKey) {
    console.log('[EmailService] Resend configuration detected');
    const sender = getFromAddress();
    console.log(`[EmailService] Sender configured: ${sender}`);

    const resend = getResendClient();
    if (resend) {
      try {
        const domainsRes = await resend.domains.list();
        if (domainsRes.error) {
          const safeErr = sanitizeError(domainsRes.error.message || domainsRes.error.name);
          console.warn(`[EmailService] Resend domain check notice: ${safeErr}`);
        } else {
          const verifiedDomains = (domainsRes.data?.data || []).filter((d: any) => d.status === 'verified').map((d: any) => d.name);
          console.log(`[EmailService] Resend API connected successfully (Verified domains: ${verifiedDomains.length > 0 ? verifiedDomains.join(', ') : 'none yet'})`);
        }
      } catch (err: any) {
        const safeErr = sanitizeError(err?.message || err);
        console.warn(`[EmailService] Resend startup check note: ${safeErr}`);
      }
    }
    lastVerificationResult = 'SUCCESS (Resend API)';
    return true;
  }

  const { user, pass } = getSmtpCredentials();

  if (!user || !pass) {
    console.warn('[EmailService] No email provider configured (EMAIL_USER/EMAIL_PASSWORD and RESEND_API_KEY missing). Emails will be skipped safely.');
    lastVerificationResult = 'FAILED (Credentials missing)';
    return false;
  }

  // Refresh host configs
  config465.host = getTargetHost();
  config587.host = getTargetHost();

  const explicitPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : null;
  const configsToTest = explicitPort === 587 ? [config587, config465] : [config465, config587];

  for (let i = 0; i < configsToTest.length; i++) {
    const cfg = configsToTest[i];
    activeConfig = cfg;

    console.log(`[EmailService] SMTP configuration detected: host=${cfg.host}, port=${cfg.port}, secure=${cfg.secure}${cfg.requireTLS ? ', requireTLS: true' : ''}`);
    console.log(`[EmailService] SMTP host: ${cfg.host}`);
    console.log(`[EmailService] SMTP port: ${cfg.port}`);
    console.log(`[EmailService] SMTP secure setting: ${cfg.secure}`);

    const transporter = createTransporterForConfig(cfg);
    if (!transporter) continue;

    try {
      console.log(`[EmailService] Verifying connection to ${cfg.host}:${cfg.port}...`);
      await transporter.verify();
      console.log('[EmailService] SMTP connection verification result: SUCCESS');
      lastVerificationResult = 'SUCCESS';
      lastErrorCodeMessage = null;
      activeTransporter = transporter;
      return true;
    } catch (error: any) {
      const safeErr = sanitizeError(error);
      const codeOrMsg = error?.code ? `${error.code}: ${safeErr}` : safeErr;
      console.error('[EmailService] SMTP connection verification result: FAILED');
      console.error(`[EmailService] SMTP error code/message: ${codeOrMsg}`);
      lastVerificationResult = 'FAILED';
      lastErrorCodeMessage = codeOrMsg;

      if (i < configsToTest.length - 1) {
        console.log(`[EmailService] Port ${cfg.port} verification timed out or failed. Testing alternate Gmail submission configuration (Port ${configsToTest[i + 1].port})...`);
      }
    }
  }

  // If both configurations failed verification, retain fallback transporter for runtime attempts
  if (!activeTransporter) {
    activeConfig = config587;
    activeTransporter = createTransporterForConfig(config587);
  }

  return false;
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
  notificationType?: string;
}): Promise<boolean> => {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const validRecipients = Array.from(
      new Set(
        recipients
          .map(r => (r || '').trim().toLowerCase())
          .filter(r => r && r.includes('@'))
      )
    );

    if (validRecipients.length === 0) {
      console.warn('[EmailService] No valid recipient email provided.');
      return false;
    }

    const maskedRecipients = validRecipients.map(maskEmail).join(', ');
    const notifType = options.notificationType || 'NOTIFICATION';
    const fromAddr = getFromAddress();

    console.log('[EmailService] Email send started');
    console.log(`[EmailService] Sending [${notifType}] "${options.subject}"`);
    console.log(`[EmailService] From: ${fromAddr} -> To: ${maskedRecipients}`);

    // 1. Primary: Dispatch via Resend SDK (HTTPS - unblocked by cloud providers)
    const resend = getResendClient();
    if (resend) {
      console.log('[EmailService] Dispatching email via Resend API (HTTPS)...');
      const response = await resend.emails.send({
        from: fromAddr,
        to: validRecipients,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (response.error) {
        const safeErr = sanitizeError(response.error.message || response.error.name || JSON.stringify(response.error));
        console.error(`[EmailService] Email send failed: ${safeErr}`);
        lastSendResult = `FAILED (${safeErr})`;
        console.log('Email send result: FAILED');
        return false;
      }

      console.log('[EmailService] Email sent successfully');
      console.log(`[EmailService] Delivered via Resend to: ${maskedRecipients} (MessageId: ${response.data?.id})`);
      lastSendResult = `SUCCESS (MessageId: ${response.data?.id})`;
      console.log('Email send result: SUCCESS');
      return true;
    }

    // 2. Fallback: SMTP transport
    if (!activeTransporter) {
      activeTransporter = createTransporterForConfig(activeConfig);
    }

    if (!activeTransporter) {
      console.warn(`[EmailService] No email provider configured (missing RESEND_API_KEY and SMTP credentials). Email skipped for: ${maskedRecipients}`);
      lastSendResult = 'FAILED (No email provider configured)';
      console.log('Email send result: FAILED');
      return false;
    }

    console.log(`[EmailService] SMTP configuration detected: host=${activeConfig.host}, port=${activeConfig.port}, secure=${activeConfig.secure}${activeConfig.requireTLS ? ', requireTLS: true' : ''}`);
    console.log(`[EmailService] SMTP host: ${activeConfig.host}`);
    console.log(`[EmailService] SMTP port: ${activeConfig.port}`);
    console.log(`[EmailService] SMTP secure setting: ${activeConfig.secure}`);

    let info: any = null;
    try {
      info = await activeTransporter.sendMail({
        from: fromAddr,
        to: validRecipients.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (primaryErr: any) {
      const safeErr = sanitizeError(primaryErr);
      const codeOrMsg = primaryErr?.code ? `${primaryErr.code}: ${safeErr}` : safeErr;
      console.warn(`[EmailService] Primary transport on port ${activeConfig.port} failed: ${codeOrMsg}`);
      console.warn(`[EmailService] SMTP error code/message: ${codeOrMsg}`);

      // Attempt fallback on alternate Gmail configuration (e.g. 465 -> 587 or 587 -> 465)
      const altConfig = activeConfig.port === 465 ? config587 : config465;
      console.log(`[EmailService] Testing alternate Gmail transport on port ${altConfig.port}...`);
      console.log(`[EmailService] SMTP configuration detected: host=${altConfig.host}, port=${altConfig.port}, secure=${altConfig.secure}${altConfig.requireTLS ? ', requireTLS: true' : ''}`);
      console.log(`[EmailService] SMTP host: ${altConfig.host}`);
      console.log(`[EmailService] SMTP port: ${altConfig.port}`);
      console.log(`[EmailService] SMTP secure setting: ${altConfig.secure}`);

      const altTransporter = createTransporterForConfig(altConfig);
      if (altTransporter) {
        info = await altTransporter.sendMail({
          from: fromAddr,
          to: validRecipients.join(', '),
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        activeConfig = altConfig;
        activeTransporter = altTransporter;
        console.log(`[EmailService] Alternate transport on port ${altConfig.port} succeeded! Updated active transporter.`);
      } else {
        throw primaryErr;
      }
    }

    console.log('[EmailService] Email sent successfully');
    console.log(`[EmailService] Email successfully delivered to: ${maskedRecipients} (MessageId: ${info?.messageId})`);
    console.log('Email send result: SUCCESS');
    lastSendResult = 'SUCCESS';
    return true;
  } catch (error: any) {
    const safeErr = sanitizeError(error);
    const codeOrMsg = error?.code ? `${error.code}: ${safeErr}` : safeErr;
    console.error(`[EmailService] Email send failed: ${codeOrMsg}`);
    console.log('Email send result: FAILED');
    lastSendResult = `FAILED (${codeOrMsg})`;
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
  expiryTime?: Date | string;
  status?: string;
}

export const sendDonationCreatedEmail = async (data: DonationCreatedEmailData): Promise<boolean> => {
  const unit = data.unit || 'kg';
  const status = data.status || 'Waiting for NGO Acceptance';

  const bodyContent = `
    <p>Hello ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Your food donation request has been successfully submitted to the NGO. Please wait while the NGO reviews and accepts your request.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
      ${data.foodCategory ? `<div class="row"><span class="label">Category:</span><span class="value">${data.foodCategory}</span></div>` : ''}
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">Location:</span><span class="value">${data.pickupLocation}</span></div>
      <div class="row"><span class="label">Status:</span><span class="value"><span class="badge">Waiting for NGO Acceptance</span></span></div>
    </div>
    <p>Thank you for helping reduce food waste and support people in need.</p>
    <p style="margin-top: 16px; font-weight: 600; color: #166534;">SmartFoodRescue Team</p>
  `;

  const html = wrapEmailTemplate('Food Donation Request Submitted', bodyContent);
  const text = `Hello ${data.donorName},\n\nYour food donation request has been successfully submitted to the NGO. Please wait while the NGO reviews and accepts your request.\n\nDonation Details:\n- Donation ID: ${data.donationId}\n- Food Type: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- Location: ${data.pickupLocation}\n- Status: Waiting for NGO Acceptance\n\nThank you for helping reduce food waste and support people in need.\n\nSmartFoodRescue Team`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Request Submitted - SmartFoodRescue',
    text,
    html,
    notificationType: 'DONATION_CREATED'
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

  const bodyContent = `
    <p>Hello ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Good news! Your food donation request has been accepted by an NGO.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">NGO:</span><span class="value">${data.ngoName}</span></div>
      <div class="row"><span class="label">Status:</span><span class="value"><span class="badge">Accepted</span></span></div>
      ${data.pickupLocation ? `<div class="row"><span class="label">Pickup Location:</span><span class="value">${data.pickupLocation}</span></div>` : ''}
      ${data.volunteerName ? `<div class="row"><span class="label">Assigned Volunteer:</span><span class="value">${data.volunteerName} ${data.volunteerPhone ? `(${data.volunteerPhone})` : ''}</span></div>` : ''}
    </div>
    <p>The pickup/delivery process will now continue.</p>
    <p>Thank you for supporting SmartFoodRescue.</p>
    <p style="margin-top: 16px; font-weight: 600; color: #166534;">SmartFoodRescue Team</p>
  `;

  const html = wrapEmailTemplate('Food Donation Request Accepted', bodyContent);
  const text = `Hello ${data.donorName},\n\nGood news!\n\nYour food donation request has been accepted by an NGO.\n\nDonation Details:\n- Donation ID: ${data.donationId}\n- Food Type: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- NGO: ${data.ngoName}\n- Status: Accepted\n\nThe pickup/delivery process will now continue.\n\nThank you for supporting SmartFoodRescue.\n\nSmartFoodRescue Team`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Request Accepted - SmartFoodRescue',
    text,
    html,
    notificationType: 'NGO_ACCEPTED'
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
    subject = 'Food Pickup Assigned - SmartFoodRescue';
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
    notificationType: data.status === 'ASSIGNED' ? 'VOLUNTEER_ASSIGNED' : `VOLUNTEER_${data.status}`
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
    <p>Hello ${data.donorName},</p>
    <p style="font-size: 15px; font-weight: 600; color: #166534;">
      Your donated food has been delivered successfully.
    </p>
    <div class="card">
      <div class="row"><span class="label">Donation ID:</span><span class="value">#${data.donationId}</span></div>
      <div class="row"><span class="label">Food Type:</span><span class="value">${data.foodType}</span></div>
      <div class="row"><span class="label">Quantity:</span><span class="value">${data.quantity} ${unit}</span></div>
      <div class="row"><span class="label">NGO:</span><span class="value">${data.ngoName}</span></div>
      <div class="row"><span class="label">Status:</span><span class="value"><span class="badge">Delivered Successfully</span></span></div>
      <div class="row"><span class="label">Delivery Date:</span><span class="value">${deliveryTimeStr}</span></div>
      ${data.volunteerName ? `<div class="row"><span class="label">Volunteer / Pickup Info:</span><span class="value">${data.volunteerName}</span></div>` : ''}
    </div>
    <p>Thank you for helping reduce food waste and support people in need.</p>
    <p style="margin-top: 16px; font-weight: 600; color: #166534;">SmartFoodRescue Team</p>
  `;

  const html = wrapEmailTemplate('Food Donation Delivered Successfully', bodyContent);
  const text = `Hello ${data.donorName},\n\nYour donated food has been delivered successfully.\n\nDonation Details:\n- Donation ID: ${data.donationId}\n- Food Type: ${data.foodType}\n- Quantity: ${data.quantity} ${unit}\n- NGO: ${data.ngoName}\n- Status: Delivered Successfully\n- Delivery Date: ${deliveryTimeStr}\n\nThank you for helping reduce food waste and support people in need.\n\nSmartFoodRescue Team`;

  return sendEmailSafe({
    to: data.to,
    subject: 'Food Donation Delivered Successfully - SmartFoodRescue',
    text,
    html,
    notificationType: 'DELIVERED'
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
