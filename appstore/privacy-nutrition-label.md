# SmartMe — App Privacy "Nutrition Label" (App Store Connect)

## How to fill in App Store Connect

Go to: App Store Connect → Your App → App Privacy → Get Started

---

## Data Collection Table

| Data Type | Collected? | Linked to Identity? | Used for Tracking? | Purpose |
|-----------|-----------|--------------------|--------------------|---------|
| **Contact Info — Email Address** | Yes | Yes | No | App Functionality |
| **Contact Info — Name** (username) | Yes | Yes | No | App Functionality |
| **Usage Data — Product Interaction** | Yes | No | No | Analytics (PostHog, opt-in only) |
| **Diagnostics — Crash Data** | Yes | No | No | App Functionality (Sentry) |
| **Financial Info** | **Not Collected** | — | — | *(Stripe planned but not active — do NOT declare)* |
| **Audio Data** | **Not Collected** | — | — | *(See note below)* |
| **Photos or Videos** | **Not Collected** | — | — | *(See note below)* |

---

## Important Notes for Each Data Type

### Contact Info — Email Address
- **What**: User's email address provided during registration
- **Purpose**: Account creation, email verification, password reset, transactional emails
- **Select in ASC**: "App Functionality"
- **Linked**: Yes — tied to user account

### Contact Info — Name (Username)
- **What**: Username chosen during registration
- **Purpose**: Display name in the app, personalized greetings
- **Select in ASC**: "App Functionality"
- **Linked**: Yes — tied to user account

### Usage Data — Product Interaction
- **What**: Anonymous page views, feature usage, button clicks
- **Purpose**: Understanding which features are used, improving UX
- **Select in ASC**: "Analytics"
- **Linked**: No — PostHog anonymizes data
- **Note**: Only collected AFTER explicit cookie/analytics consent (opt-in)

### Diagnostics — Crash Data
- **What**: Anonymous crash reports, error stack traces
- **Purpose**: Identifying and fixing bugs
- **Select in ASC**: "App Functionality"
- **Linked**: No — Sentry reports are anonymized
- **Provider**: Sentry (sentry.io)

### Financial Info (Stripe)
- **Status**: NOT COLLECTED
- **Reason**: Stripe billing is planned (Pro plan) but not active. All billing UI is hidden on iOS. No payment data flows through the app currently.
- **Action**: Do NOT declare this category. When Pro launches with IAP, update the privacy label.

### Audio Data (Voice Commands)
- **Status**: NOT COLLECTED (select "Not Collected")
- **Reason**: Audio is recorded on-device, sent to our backend, forwarded to OpenAI Whisper API for real-time transcription, and immediately discarded. Neither SmartMe servers nor OpenAI retain the audio data beyond the processing request. The transcribed text (not audio) is used to parse user intent.
- **Apple's definition**: "Collected" means data that is "transmitted off the device in a way that is accessible to you (the developer) or third parties for longer than what is necessary to service the request in real-time." Since audio is ephemeral and not stored, it does NOT meet Apple's definition of "collected."
- **Action**: Do NOT declare Audio Data. If Apple asks during review, explain the ephemeral processing model.

### Photos or Videos (Receipt Scanning)
- **Status**: NOT COLLECTED (select "Not Collected")
- **Reason**: Receipt images are uploaded to SmartMe backend for OCR processing (Tesseract, running locally on our server). The image is processed, text is extracted, and the image is discarded immediately. Images are NOT stored on our servers.
- **Apple's definition**: Same ephemeral processing rationale as Audio Data.
- **Action**: Do NOT declare Photos. If Apple asks, explain local OCR + immediate discard.

---

## Step-by-Step in App Store Connect

1. Go to **App Privacy** section
2. Click **Get Started**
3. Answer **"Yes, we collect data"**
4. Select data types:
   - [x] Contact Info → Email Address
   - [x] Contact Info → Name
   - [x] Usage Data → Product Interaction
   - [x] Diagnostics → Crash Data
5. For each selected type, fill in:
   - **Email Address**: Linked to Identity = Yes, Tracking = No, Purpose = App Functionality
   - **Name**: Linked to Identity = Yes, Tracking = No, Purpose = App Functionality
   - **Product Interaction**: Linked to Identity = No, Tracking = No, Purpose = Analytics
   - **Crash Data**: Linked to Identity = No, Tracking = No, Purpose = App Functionality
6. Review and Publish

---

## Disclosure for Apple Review (if questioned about Audio/Photos)

> "SmartMe processes audio recordings and receipt photos ephemerally. Audio is sent to OpenAI's Whisper API for real-time speech-to-text transcription and is not retained by SmartMe or OpenAI beyond the duration of the API request. Receipt photos are processed by Tesseract OCR running on SmartMe's own server infrastructure (not a third-party cloud OCR service) and are discarded immediately after text extraction. Neither audio nor photo data is stored, logged, or accessible after processing completes."
