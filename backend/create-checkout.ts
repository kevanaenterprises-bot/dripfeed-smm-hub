import { createClient } from '@blinkdotnew/sdk'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Stripe from 'stripe'

const app = new Hono()

app.use('*', cors())

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe secret key not configured')
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil2025-04-30.basil',
  })
}

app.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { packageId, packageName, quantity, price, dripDays, targetUrl, platform, serviceType } = body

    if (!packageId || !targetUrl || !price) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const stripe = getStripe()
    
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageName || 'Social Media Engagement',
              description: `${quantity.toLocaleString()} ${serviceType || 'engagements'} via ${platform} - ${dripDays} day drip delivery`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${c.req.parse().origin}/order?success=true&order_id=${packageId}`,
      cancel_url: `${c.req.parse().origin}/order?cancelled=true`,
      metadata: {
        packageId,
        targetUrl,
        platform,
        serviceType,
        dripDays: String(dripDays),
        quantity: String(quantity),
      },
    })

    return c.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

export default app