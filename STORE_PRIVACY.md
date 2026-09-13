# App Store & Google Play Privacy Documentation

This document provides the information needed for App Store Privacy "nutrition labels" and Google Play Data Safety declarations.

## Data Collected

### Personal Information

**Collected:** Yes  
**Purpose:** App functionality, Identity  
**Linked to User:** Yes  
**Used for Tracking:** No

**Data Types:**
- Name (first name, last name, second last name)
- Email address
- Phone number
- Document number (NIE or Passport)
- Nationality
- Registered address (street, city, postal code)
- Document issuance date

### Identifiers

**Collected:** Yes  
**Purpose:** App functionality  
**Linked to User:** Yes  
**Used for Tracking:** No

**Data Types:**
- User ID (UUID generated on account creation)
- Device ID (for client-side encryption key management)

### Usage Data

**Collected:** Yes  
**Purpose:** App functionality, Analytics  
**Linked to User:** Yes  
**Used for Tracking:** No

**Data Types:**
- Product interactions (features used, journey step progress)
- Diagnostic/error codes (failure type, HTTP status — no stack traces)
- Performance data (app launch time, response times)

### Financial Information

**Collected:** Yes (via Stripe)  
**Purpose:** App functionality (payment processing)  
**Linked to User:** Yes  
**Used for Tracking:** No

**Data Types:**
- Payment method (card type, last 4 digits - collected by Stripe)
- Purchase history (amount, date, product type)

**Note:** Credit card details are collected and processed directly by Stripe (our payment processor) and never touch our servers. We only receive confirmation of successful payments.

## Data Usage

### App Functionality
- Process TIE residency card applications
- Book appointments with Spanish government offices
- Pre-fill official forms with user information
- Track application progress
- Send notifications about application status

### Analytics
- Improve user experience
- Identify and fix bugs (diagnostic error codes from the app)
- Monitor app performance
- Understand feature usage (journey progress snapshots)

### Identity
- Authenticate users via Google Sign-In
- Verify user identity for government submissions

## Data Security Practices

### Encryption in Transit
**Yes** - All data transmitted between the app and our servers uses TLS/SSL encryption.

### Encryption at Rest
**Yes** - Personal information is encrypted on the user's device before transmission using AES-256-GCM encryption. The encryption key is stored in the device's secure enclave (iOS Keychain / Android Keystore) with biometric/passcode protection.

**Backend Storage:** The backend stores only encrypted ciphertext and cannot decrypt user personal information (zero-knowledge architecture).

### Data Deletion
Users can delete their account and all associated data at any time through the app settings ("Legal & Privacy" > "Delete My Account"). This action:
- Permanently deletes all data from our servers
- Removes the encryption key from the device
- Clears all local storage

Account deletion is irreversible and complies with GDPR's "Right to Erasure" (Art. 17).

**Account Deletion URL (Apple requirement):** `visamesa://legal` (deep link to Legal & Privacy screen in the app)

## Data Sharing

### Third-Party Sharing
We share data with the following third parties:

1. **Stripe** (Payment Processor)
   - **Data Shared:** Email, payment amount, currency
   - **Purpose:** Payment processing
   - **Privacy Policy:** https://stripe.com/privacy

2. **Spanish Government Offices**
   - **Data Shared:** All personal information (name, document number, address, etc.)
   - **Purpose:** TIE residency card application processing
   - **Legal Basis:** User consent, legal obligation (Spanish immigration law)

### No Data Selling
We do **not** sell, rent, or trade user data to third parties for marketing or advertising purposes.

## User Rights

Under GDPR and Spanish data protection law, users have the right to:

- **Access:** Request a copy of their data ("Export My Data" in app)
- **Rectification:** Correct inaccurate data through their profile
- **Erasure:** Delete their account and all data ("Delete My Account" in app)
- **Data Portability:** Receive their data in JSON format
- **Withdraw Consent:** Revoke consent at any time

## Privacy Policy Link
https://visamesa.com/privacy

## Support Contact
**Email:** privacy@visamesa.com

## Google Play Data Safety Answers

### Does your app collect or share any of the required user data types?
**Yes**

### Is all of the user data collected by your app encrypted in transit?
**Yes**

### Do you provide a way for users to request that their data is deleted?
**Yes** - Through "Legal & Privacy" > "Delete My Account" in the app settings

### Data Types Summary (Google Play Format)

| Data Type | Collected | Shared | Purpose | Optional |
|-----------|-----------|--------|---------|----------|
| Name | Yes | Yes (with Spanish gov) | App functionality | No |
| Email | Yes | Yes (with Stripe) | App functionality, Account management | No |
| Phone | Yes | Yes (with Spanish gov) | App functionality | No |
| Address | Yes | Yes (with Spanish gov) | App functionality | No |
| User ID | Yes | No | App functionality | No |
| Device ID | Yes | No | App functionality | No |
| Crash logs | Yes | No | App functionality | No |
| Purchase history | Yes | Yes (with Stripe) | App functionality | No |

### Security Practices (Google Play Format)
- [x] Data is encrypted in transit
- [x] Users can request data deletion
- [x] Data is encrypted at rest (client-side, device-bound keys)
- [x] You follow the Families Policy (if applicable: No - app not targeted at children)
- [x] Independent security review completed (Recommended: Yes - have a security audit)

## App Store Privacy Label Answers

### Account Creation Required
**Yes** - Users must sign in with Google to use the app

### Age Rating
**4+** (no age-restricted content, but TIE applications typically require users 18+)

### Data Used to Track You
**None** - We do not use data for tracking across apps/websites owned by other companies

### Data Linked to You
- Name
- Email Address
- Phone Number
- Physical Address
- User ID
- Purchase History
- Crash Data
- Performance Data

### Data Not Linked to You
**None** - All collected data is linked to the user's identity

## Notes for App Store Submission

1. **Encryption Declaration:** The app uses encryption (AES-256-GCM) that is exempt from export compliance requirements under Category 5 Part 2 (mass market encryption).

2. **Government Access:** Clarify in app description that user data is submitted to Spanish government offices as part of the TIE application process.

3. **Third-Party SDKs:** 
   - Google Sign-In SDK
   - Stripe SDK (for web redirect only, not in-app)
   - React Native core libraries

4. **Sensitive Permissions:**
   - Biometric authentication (iOS Face ID / Touch ID, Android Biometric) - used to unlock encrypted profile data stored on device

---

**Last Updated:** June 27, 2026  
**Version:** 1.0

**⚠️ Important:** Review this document with your legal team before submitting to App Store or Google Play. Privacy requirements change frequently and vary by jurisdiction.
