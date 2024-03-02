import { Request, Response, NextFunction } from 'express';
import { UrlModel } from '../models/urls.model';
import { generateShortUrl } from '../services/generateShortUrl';
import { v4 as uuid } from 'uuid';

export const createShortUrl = async (req: Request, res: Response, next: NextFunction) => {
  const { longUrl } = req.body;

  try {
    // Check if the url document already exists in database
    let urlDocument = await UrlModel.findOne({ longUrl });
    let shortUrlId;

    // if the url document doesnt exisit, create a new document
    if(!urlDocument){
      const longUrlId = uuid();
      shortUrlId = generateShortUrl(longUrlId);

      urlDocument = new UrlModel({
        longUrlId,
        longUrl,
        shortUrls: [{ shortUrlId }],
      });

      await urlDocument.save();
    } else {
      // if the url document exists, add a new shortUrlId to the doc
      shortUrlId = generateShortUrl(urlDocument.longUrlId);
      urlDocument.shortUrls.push({ shortUrlId });
      await urlDocument.save();
    }
    // return shortUrl to client & 201 created
    res.status(201).json({ shortUrl: `www.shorturl/${shortUrlId}` });
  } catch (err) {
    next({
      status: 500,
      message: 'Server error',
      err
    })
  }
};

export const redirectToLongUrl = async (req: Request, res: Response, next: NextFunction) => {
    const { shortUrlId } = req.params;

  try {
    // check if the url document exists in database
    const urlDocument = await UrlModel.findOne({ "shortUrls.shortUrlId": shortUrlId });
    //if the doc doesnt exist, return 404 & error message to user
    if(!urlDocument){
      return res.status(404).json({ error: "Short URL not found" });
    } else {
    // if the doc exist, redirect user to longUrl with 301 permanent redirect
      return res.redirect(301, urlDocument.longUrl);
    }
  } catch (err) {
    next({
      status: 500,
      message: 'Server error',
      err
    })
  }
}
