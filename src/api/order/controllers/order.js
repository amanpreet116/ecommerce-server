"use strict";

/* @ts-ignore */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async customOrderController(ctx) {

 },
 async create(ctx){
  try{

    const {products} = ctx.request.body;

    const LineItems = await Promise.all(products.map(async (product) => {

      const productEntities =  await strapi.entityService.findMany("api::product.product", {
				filters: {
					key: product.key
				}
			})  
      const realProduct = productEntities[0];   
       return {
        price_data:{
          currency: 'inr',
          product_data:{
            name: product.title,
            images: [product.image]
          },
          unit_amount: realProduct.price *100
        },
        quantity: product.quantity
      }
    }));

    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {
        allowed_countries: ['IN']
      },
      
      line_items: LineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_BASE_URL}/payments/success`,
      cancel_url: `${process.env.CLIENT_BASE_URL}/payments/failed`,
    });

    await strapi.entityService.create('api::order.order',{
      data: {
        products,
        strapiSessionId: session.id
      },
    });
    return {stripeId: session.id}
  }


  catch(error){
    console.log(error);
    ctx.response.status = 500;
    return error;
  }
 }

 }));