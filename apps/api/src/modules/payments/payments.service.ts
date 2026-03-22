import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users, subscriptions, orders } from '../../db/schema';
import { Errors } from '../../lib/errors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

export class PaymentService {
  // ─── One-time course purchase ─────────────────────────────────
  async createCourseCheckout(userId: string, courseId: string, priceCents: number) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw Errors.notFound('User');

    const session = await stripe.checkout.sessions.create({
      mode:                'payment',
      customer_email:      user.email,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'usd',
          unit_amount:  priceCents,
          product_data: { name: 'Course Purchase' },
        },
        quantity: 1,
      }],
      metadata:    { userId, courseId, type: 'course' },
      success_url: `${process.env.FRONTEND_URL}/dashboard?purchased=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/courses`,
    });

    return { checkoutUrl: session.url };
  }

  // ─── Pro subscription checkout ────────────────────────────────
  async createSubscriptionCheckout(userId: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw Errors.notFound('User');

    const session = await stripe.checkout.sessions.create({
      mode:                'subscription',
      customer_email:      user.email,
      payment_method_types: ['card'],
      line_items: [{
        price:    process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      }],
      metadata:    { userId, type: 'subscription' },
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing`,
    });

    return { checkoutUrl: session.url };
  }

  // ─── Stripe webhook handler ───────────────────────────────────
  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      throw Errors.validation('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncSubscription(sub);
        break;
      }
      case 'invoice.payment_failed': {
        // Could send email reminder here
        break;
      }
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { userId, courseId, type } = session.metadata ?? {};
    if (!userId) return;

    if (type === 'course' && courseId) {
      // Grant course access via enrollment
      const { CourseService } = await import('../courses/courses.service');
      const cs = new CourseService();
      try { await cs.enroll(userId, courseId); } catch { /* already enrolled */ }

      await db.insert(orders).values({
        userId,
        courseId,
        amountCents:     session.amount_total ?? 0,
        stripePaymentId: session.payment_intent as string,
        status:          'completed',
      });
    }

    if (type === 'subscription' && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await this.syncSubscription(sub, userId);
    }
  }

  private async syncSubscription(sub: Stripe.Subscription, userId?: string) {
    const metadata = sub.metadata as { userId?: string };
    const uid = userId ?? metadata.userId;
    if (!uid) return;

    const status = sub.status as any;
    const currentPeriodEnd = new Date(sub.current_period_end * 1000);

    await db
      .insert(subscriptions)
      .values({
        userId:               uid,
        stripeSubscriptionId: sub.id,
        stripeCustomerId:     sub.customer as string,
        plan:                 'pro',
        status,
        currentPeriodEnd,
      })
      .onConflictDoUpdate({
        target: [subscriptions.stripeSubscriptionId],
        set:    { status, currentPeriodEnd, updatedAt: new Date() },
      });

    // Update user plan
    const newPlan = ['active', 'trialing'].includes(status) ? 'pro' : 'free';
    await db.update(users).set({ plan: newPlan as any }).where(eq(users.id, uid));
  }
}
