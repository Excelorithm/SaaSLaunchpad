![SaaSLaunchpad – Next.js SaaS Starter](./SaaSLaunchpad.png)

# SaaSLaunchpad Next.js SaaS Starter

Welcome to the SaasLaunchpad! This project is designed to help you quickly build a SaaS application using **Next.js**. It includes features such as authentication, Stripe payment integration, and a user dashboard.

**Note:** This is an expanded version of the **[Next.js SaaS Starter](https://github.com/nextjs/saas-starter)**, offering a richer feature set beyond the original template.

**Live Demo: [https://saaslaunchpad.vercel.app/](https://saaslaunchpad.vercel.app/)**

## Key Features

- 🏠 Animated marketing landing page (`/`)
- 💳 Pricing page (`/pricing`) integrated with Stripe Checkout
- 🛠️ User and team management dashboard with CRUD operations
- 🔒 Role-based access control (RBAC) with Owner and Member roles
- 💼 Stripe Customer Portal for subscription management
- 🔑 Social authentication using **NextAuth.js**
- 🛡️ Middleware for route protection and schema validation
- 📊 User activity logging
- ✉️ Email templates using **Nodemailer**
- 🔔 Push notifications via **Firebase** and **OneSignal**

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Push Notifications**: [Firebase](https://firebase.google.com/), [OneSignal](https://onesignal.com/)

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/Excelorithm/SaaSLaunchpad
cd SaaSLaunchpad
pnpm install
```

## Local Development

Set up your environment variables by running the setup script:

```bash
pnpm app:setup
```

Run database migrations and seed the database with initial data:

```bash
pnpm db:migrate
pnpm db:seed
```

Setup Firebase Push Notifications

```bash
pnpm push:setup
```

Start the development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

To handle Stripe webhooks locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Stripe Payments

Use the following test card details for Stripe payments:

- Card Number: `4242 4242 4242 4242`
- Expiration Date: Any future date
- CVC: Any 3-digit number

## Deployment

### Setting Up Production Stripe Webhook

1. Create a new webhook in the Stripe Dashboard for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploying to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment steps to set up your project.

### Configuring Environment Variables

In your Vercel project settings, add the necessary environment variables for production:

1. `APP_NAME`: Your app name.
2. `APP_LOGO`: Your app logo.
3. `BASE_URL`: Your production domain.
4. `POSTGRES_URL`: Your production database URL.
5. `STRIPE_SECRET_KEY`: Your Stripe secret key for production.
6. `STRIPE_WEBHOOK_SECRET`: The webhook secret from your production Stripe webhook.
7. `NEXTAUTH_URL`: Same as "BASE_URL".
8. `NEXTAUTH_SECRET`: A random string for authentication. Generate one using `openssl rand -base64 32`.
9. `NEXT_PUBLIC_LOGIN_URL`: Login page URL, typically "BASE_URL/auth/signin".
10. `GOOGLE_CLIENT_ID`: Client ID for Google OAuth.
11. `GOOGLE_CLIENT_SECRET`: Client secret for Google OAuth.
12. `EMAIL_SERVER_USER`: Username for your email server.
13. `EMAIL_SERVER_PASSWORD`: Password for your email server.
14. `EMAIL_SERVER_HOST`: Host address for your email server.
15. `EMAIL_SERVER_PORT`: Port number for your email server.
16. `EMAIL_FROM`: The email address that your app will use to send emails.
17. `NEXT_PUBLIC_PUSH_NOTIFICATIONS_CHANNEL`: Channel name for push notifications.
18. `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key.
19. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth domain.
20. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID.
21. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket.
22. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID.
23. `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID.
24. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID.
25. `NEXT_PUBLIC_FIREBASE_VAPID`: Firebase VAPID key for push notifications.
26. `FIREBASE_ADMIN_PROJECT_ID`: Firebase Admin project ID.
27. `FIREBASE_ADMIN_PRIVATE_KEY`: Firebase Admin private key.
28. `FIREBASE_ADMIN_CLIENT_EMAIL`: Firebase Admin client email.
29. `NEXT_PUBLIC_ONESIGNAL_APP_ID`: OneSignal app ID for push notifications.
30. `ONESIGNAL_REST_API_KEY`: OneSignal REST API key for server-side push notifications.

## Managed software development services

If you need managed software development services or help customizing this starter for your own SaaS, visit [excelorithm.com](https://excelorithm.com).