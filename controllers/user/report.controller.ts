import type { NextFunction, Request, Response } from 'express';
import Report from '../../models/report.model';
import ErrorHandler from '../../utils/errorHandler';
import { CatchAsyncError } from '../../middlewares/catchAsyncError';

export const report = CatchAsyncError( async (req : Request, res : Response, next : NextFunction) => {

    try {
        const { id : userToModify } = req.params;
        const currentUser = req.user?._id;

        let report = await Report.findOne({user : userToModify});
        if(!report) {

            report = await Report.create({user : userToModify});
            report.reportersId.push(currentUser);

            return res.status(200).json({success : true, message : 'User has been reported'});
        }

        if(report.user.toString() === currentUser) return next(new ErrorHandler('Cannot report yourself', 400));

        const isReported = report.reportersId.includes(currentUser);
        if(!isReported) {

            report.reportersId.push(currentUser);
            await report.save();
            
            res.status(200).json({success : true, message : 'User has been reported'});
        }else {
            return next(new ErrorHandler('User has already reported', 400));
        }

    } catch (error : any) {
        return next(new ErrorHandler(error.message, 400));
    }

})