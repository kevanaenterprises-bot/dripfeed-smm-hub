import { createClient } from '@blinkdotnew/sdk'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Stripe from 'stripe'

const app = new Hono()

app.use('*', cors())

const getBlink = (env: Record<string, string>) =>
  createClient({
    projectId: env.BLINK_PROJECT_ID,
    secretKey: env.BLINK_SECRET_KEY,
  })

const getStripe = (env: Record<string, string>) => {
  const secretKey = env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Stripe secret key not configured')
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-04-30.basil2025-04-30.basil',
  })
}

// Create checkout session
app.post('/create-checkout', async (c) => {
  try {
    const env = c.env as Record<string, string>
    const body = await c.req.json()
    const { packageId, packageName, quantity, price, dripDays, targetUrl, platform, serviceType, userId } = body

    if (!packageId || !targetUrl || !price) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const stripe = getStripe(env)
    
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
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `/?view=order&success=true&order_id=${packageId}`,
      cancel_url: `/?view=order&cancelled=true`,
      metadata: {
        packageId,
        targetUrl,
        platform,
        serviceType,
        dripDays: String(dripDays),
        quantity: String(quantity),
        userId: userId || '',
      },
    })

    return c.json({ url: session.url, sessionId: session.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return c.json({ error: error.message || 'Failed to create checkout session' }, 500)
  }
})

// Stripe webhook handler
app.post('/webhook', async (c) => {
  try {
    const env = c.env as Record<string, string>
    const body = await c.req.text()
    const signature = c.req.header('stripe-signature')
    
    const stripe = getStripe(env)
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET
    
    let event: Stripe.Event
    
    try {
      event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return c.json({ error: 'Invalid signature' }, 400)
    }

    const blink = getBlink(env)

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      if (session.payment_status === 'paid') {
        const { packageId, targetUrl, userId, quantity, dripDays } = session.metadata || {}
        
        if (packageId && userId) {
          // Create campaign after successful payment
          const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await blink.db.campaigns.create({
            id: campaignId,
            user_id: userId,
            package_id: packageId,
            target_url: targetUrl || '',
            status: 'active',
            total_quantity: parseInt(quantity || '100'),
            delivered_quantity: 0,
            drip_days: parseInt(dripDays || '7'),
            start_date: new Date().toISOString(),
            notes: `Paid via Stripe. Session: ${session.id}`
          })

          // Create order record
          const orderId = `order_${Date.now()}`
          await blink.db.orders.create({
            id: orderId,
            user_id: userId,
            campaign_id: campaignId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            status: 'completed',
            payment_method: 'stripe',
            stripe_payment_id: session.payment_intent as string
          })

          console.log(`Campaign ${campaignId} created and activated for user ${userId}`)
        }
      }
    }

    return c.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Process drip feed deliveries
app.post('/process-drip', async (c) => {
  try {
    const env = c.env as Record<string, string>
    const blink = getBlink(env)

    // Get all active campaigns
    const campaigns = await blink.db.campaigns.list({
      where: { status: 'active' }
    })

    const now = new Date()
    let deliveriesProcessed = 0

    for (const campaign of campaigns) {
      // Skip if no start date
      if (!campaign.start_date) continue

      const startDate = new Date(campaign.start_date)
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Skip if campaign hasn't started
      if (daysSinceStart < 0) continue

      // Calculate expected deliveries based on drip schedule
      const totalDays = campaign.drip_days || 7
      const totalQuantity = campaign.total_quantity || 100
      
      // Calculate daily delivery rate (with some randomness for natural look)
      const baseDailyRate = Math.ceil(totalQuantity / totalDays)
      
      // Calculate deliveries for today
      let todayDeliveries = baseDailyRate
      
      // Add some randomness (-20% to +20%)
      const randomFactor = 0.8 + Math.random() * 0.4
      todayDeliveries = Math.round(todayDeliveries * randomFactor)

      // Don't exceed total quantity
      const remaining = totalQuantity - (campaign.delivered_quantity || 0)
      todayDeliveries = Math.min(todayDeliveries, remaining)

      if (todayDeliveries > 0 && remaining > 0) {
        // Update delivered quantity
        await blink.db.campaigns.update(campaign.id, {
          delivered_quantity: (campaign.delivered_quantity || 0) + todayDeliveries
        })

        deliveriesProcessed += todayDeliveries
        console.log(`Campaign ${campaign.id}: delivered ${todayDeliveries} (total: ${(campaign.delivered_quantity || 0) + todayDeliveries})`)
      }

      // Check if campaign is complete
      const newDelivered = (campaign.delivered_quantity || 0) + todayDeliveries
      if (newDelivered >= totalQuantity) {
        await blink.db.campaigns.update(campaign.id, {
          status: 'completed',
          end_date: now.toISOString()
        })
        console.log(`Campaign ${campaign.id} completed`)
      }
    }

    return c.json({ 
      success: true, 
      campaignsProcessed: campaigns.length,
      deliveriesProcessed,
      timestamp: now.toISOString()
    })
  } catch (error: any) {
    console.error('Drip processing error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get campaign status
app.get('/campaign/:id', async (c) => {
  try {
    const env = c.env as Record<string, string>
    const blink = getBlink(env)
    const campaignId = c.req.param('id')

    const campaign = await blink.db.campaigns.get(campaignId)
    
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404)
    }

    // Calculate progress
    const progress = campaign.total_quantity > 0 
      ? Math.round(((campaign.delivered_quantity || 0) / campaign.total_quantity) * 100)
      : 0

    return c.json({
      campaign,
      progress,
      remaining: campaign.total_quantity - (campaign.delivered_quantity || 0)
    })
  } catch (error: any) {
    console.error('Get campaign error:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Queue handler for scheduled drip processing
app.post('/api/queue', async (c) => {
  try {
    const env = c.env as Record<string, string>
    const { taskName, payload, taskId } = await c.req.json()

    switch (taskName) {
      case 'process-drip':
        // Process drip feed deliveries
        const blink = getBlink(env)

        const campaigns = await blink.db.campaigns.list({
          where: { status: 'active' }
        })

        const now = new Date()
        let deliveriesProcessed = 0

        for (const campaign of campaigns) {
          if (!campaign.start_date) continue

          const startDate = new Date(campaign.start_date)
          const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceStart < 0) continue

          const totalDays = campaign.drip_days || 7
          const totalQuantity = campaign.total_quantity || 100
          const baseDailyRate = Math.ceil(totalQuantity / totalDays)
          
          let todayDeliveries = baseDailyRate
          const randomFactor = 0.8 + Math.random() * 0.4
          todayDeliveries = Math.round(todayDeliveries * randomFactor)

          const remaining = totalQuantity - (campaign.delivered_quantity || 0)
          todayDeliveries = Math.min(todayDeliveries, remaining)

          if (todayDeliveries > 0 && remaining > 0) {
            await blink.db.campaigns.update(campaign.id, {
              delivered_quantity: (campaign.delivered_quantity || 0) + todayDeliveries
            })
            deliveriesProcessed += todayDeliveries
          }

          const newDelivered = (campaign.delivered_quantity || 0) + todayDeliveries
          if (newDelivered >= totalQuantity) {
            await blink.db.campaigns.update(campaign.id, {
              status: 'completed',
              end_date: now.toISOString()
            })
          }
        }

        console.log(`Drip processing complete: ${deliveriesProcessed} deliveries`)
        return c.json({ ok: true, deliveriesProcessed })

      default:
        return c.json({ error: `Unknown task: ${taskName}` }, 400)
    }
  } catch (error: any) {
    console.error('Queue handler error:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app