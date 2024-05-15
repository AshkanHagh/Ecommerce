import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../../middlewares/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import { redis } from '../../db/redis';
import Product from '../../models/shop/product.model';
import Inventory from '../../models/shop/inventory.model';
import type { IInventoryModel, IProductModel } from '../../types';
import { validateAddProduct } from '../../validation/Joi';
import {v2 as cloudinary} from 'cloudinary';

export const createProduct = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { name, price, description, category, color, size } = req.body as IProductModel;
        const { images } = req.body as any;
        const { availableQuantity : quantity } = req.body as IInventoryModel;

        const {error, value} = validateAddProduct(req.body);
        if(error) return next(new ErrorHandler(error.message, 400));

        const product = await Product.create({
            name, price, description, category, color, size, user : req.user?._id
        });

        if (images && images.length > 0) {
            const uploadedImages = [];

            for (const image of images) {

                try {
                    const myCloud = await cloudinary.uploader.upload(image, {
                        folder: 'Images'
                    });
                    uploadedImages.push({
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url
                    });
                } catch (error : any) {
                    return next(new ErrorHandler(error.message, 400));
                }
            }

            product.images = uploadedImages;
            await product.save();
        }

        const inventory = await Inventory.create({
            productId : product._id, availableQuantity : quantity
        });

        await redis.set(`product:${product._id}`, JSON.stringify(product));
        res.status(201).json({success : true, product, inventory});

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const products =  CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {

    try {
        const keys = await redis.keys(`product:*`);
        const products = await Promise.all(keys.map(async (key : string) => {

            const data = await redis.get(key);
            const product = JSON.parse(data!);

            return product
        }));

        const sortedProducts = products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.status(200).json(sortedProducts.filter(Boolean));

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

export const searchProduct = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { query } = req.params;

        const keys = await redis.keys(`product:*`);
        const products = await Promise.all(keys.map(async (key: string) => {

            const productData = await redis.get(key);
            const product = JSON.parse(productData!);

            const regex = new RegExp(query, 'i');
            if(regex.test(product.name) || regex.test(product.category)) {
                return product;
            }
        }));

        res.status(200).json(products.filter(Boolean));

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const singleProduct = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { id : productId } = req.params;

        const data = await redis.get(`product:${productId}`);
        const product = JSON.parse(data!);

        res.status(200).json(product);

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const editProductInfo = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { name, price, description, images, category, color, size } = req.body as IProductModel;
        const { id : productId } = req.params;
        const userId = req.user?._id;

        const product = await Product.findById(productId);
        if(product?.user.toString() !== userId.toString()) return next(new ErrorHandler('Access denied only owner can access this resource', 400));


        

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }
});