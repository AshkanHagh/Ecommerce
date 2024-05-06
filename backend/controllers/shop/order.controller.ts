import type { NextFunction, Request, Response } from 'express';
import Cart from '../../models/shop/cart.model';
import Order from '../../models/shop/order.model';
import Inventory from '../../models/shop/inventory.model';
import type { IAddress, ICartDocument, IInventory, IOrder, IOrderDocument, IUser } from '../../types';
import ZarinpalCheckout from 'zarinpal-checkout';
import User from '../../models/user.model';
import Address from '../../models/shop/address.model';

let zarinpal = ZarinpalCheckout.create(process.env.MERCHANT_ID, true);


export const orderDetail = async (req : Request, res : Response, next : NextFunction) => {

    try {
        const orderId = req.params.id;

        const order : IOrderDocument = await Order.findById(orderId).populate('products address').select('products totalPrice status address');

        if(!order) return res.status(404).json({ error: 'Order not found' });

        const mappedOrder = order.products.map(product => {

            return {
                name : product.name,
                price : product.price,
                description : product.description,
                images : product.images,
                totalPrice : order.totalPrice,
                status : order.status,
                address : order.address
            }
        })

        res.status(200).json(mappedOrder);

    } catch (error) {

        next(error);
    }

}

export const updateOrder = async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { id: orderId } = req.params;
        const { status } = req.body;

        const order : IOrder | null = await Order.findById(orderId);

        if(!order) return res.status(404).json({error : 'Order not found'});

        order.status = status;

        await order.save();

        res.status(200).json({message : 'Order Updated', status : order.status});

    } catch (error) {
        
        next(error);
    }

}

export const getPayment = async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { _id: userId, email } = req.user;
        
        const cart : ICartDocument | null = await Cart.findOne({user : userId}).populate('products.product');

        let totalPrice : number = 0;

        for (const item of cart.products) {
            totalPrice += item.product.price * item.quantity
        }

        const payment = await zarinpal.PaymentRequest({
            Amount : totalPrice,
            CallbackURL : 'http://localhost:5000/api/product/payment/verify',
            Description : 'Tanks',
            Email : email,
            Mobile : '09373349901',
        });

        res.status(200).json(payment);

    } catch (error) {
        
        next(error);
    }

}

export const verifyPayment = async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { Authority, Status } = req.query;
        const userId = req.user._id;

        const cart : ICartDocument | null = await Cart.findOne({user : userId}).populate('products.product');

        let totalPrice = 0;

        for (const item of cart.products) {
            totalPrice += item.product.price * item.quantity
        }

        if(Status == 'NOK') return res.status(200).json({error : 'Payment failed!'});

        const payment = await zarinpal.PaymentVerification({
            Amount : totalPrice,
            Authority
        });

        if(payment.status !== 100) return res.status(200).json({error : 'Payment failed!'});

        try {
            const userId = req.user._id;
    
            const cart : ICartDocument | null = await Cart.findOne({user : userId}).populate('products.product');
            const address : IAddress | null = await Address.findOne({user : userId});
    
            let totalPrice = 0;
    
            for (const item of cart.products) {

                totalPrice += item.product.price * item.quantity;
    
                const inventory = await Inventory.findOne({productId : item.product._id});

                if(!inventory) return res.status(404).json({error : 'Inventory not found'});
    
                if(inventory.availableQuantity === 0 || inventory.availableQuantity < item.quantity)
                    return res.status(400).json({error : 'Not enough available products'});
            }
    
            const order = new Order({
                
                user: userId,
                products: cart.products.map((item: any) => item.product),
                totalPrice, status: 'pending', address
            });
    
            await order.save();
    
            await Cart.findByIdAndUpdate(cart._id, {
                $pull : {products : {product : order.products}}
            });
    
            for (const item of cart.products) {
    
                const inventory : IInventory | null = await Inventory.findOne({productId : item.product._id});
                inventory.availableQuantity -= item.quantity;
    
                await inventory.save();
            }
    
            res.status(200).json({message: `Order placed successfully ${payment.RefID}`});
            
        } catch (error) {
            
            next(error);
        }

    } catch (error) {
        
        next(error);
    }

}