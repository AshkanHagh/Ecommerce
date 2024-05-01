import type { Request, Response } from 'express';
import Product from '../models/product.model';
import type { IProduct } from '../types';

export const newProduct = async (req : Request, res : Response) => {

    try {
        const { name, price, description, category, color, size } = req.body;
        const userId : string = req.user._id;

        const newProduct : IProduct | null = new Product({
            name, price, description, category, color, size,
            user : userId
        });

        await newProduct.save();

        res.status(201).json(newProduct);

    } catch (error) {
        
        console.log('error in newProduct controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const searchProduct = async (req : Request, res : Response) => {

    try {
        const { query } = req.body;

        const product : IProduct[] | null = await Product.find({
            $or : [
                {name : {$regex : new RegExp(query, 'i') }},
                {category : {$regex : new RegExp(query, 'i') }}
            ]
        });

        if(!product) return res.status(404).json({error : 'Product not found'});

        res.status(200).json(product);

    } catch (error) {
        
        console.log('error in newProduct controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const products = async (req : Request, res : Response) => {

    try {
        const products : IProduct[] | null = await Product.find().select('-updatedAt -__v');

        if(!products) return res.status(404).json({error : 'Product not found'});

        res.status(200).json(products);

    } catch (error) {
        
        console.log('error in products controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const singleProduct = async (req : Request, res : Response) => {

    try {
        const { id: productId } = req.params;

        const products : IProduct | null = await Product.findById(productId).select('-updatedAt -__v');

        if(!products) return res.status(404).json({error : 'Product not found'});

        res.status(200).json(products);

    } catch (error) {
        
        console.log('error in singleProduct controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}

export const getProductWithCategory = async (req : Request, res : Response) => {

    try {
        const { category } = req.params;

        const products : IProduct[] | null = await Product.find({ category : category }).select('-updatedAt -__v');

        if(!products) return res.status(404).json({error : 'Product not found'});

        res.status(200).json(products);

    } catch (error) {
        
        console.log('error in getProductWithCategory controller :', error);

        res.status(500).json({error : 'Internal server error'});
    }

}