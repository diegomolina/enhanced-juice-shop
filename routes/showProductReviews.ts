import { type Request, type Response, type NextFunction } from 'express'

import * as security from '../lib/security'
import { type Review } from '@juice-shop/data/types'
import * as db from '../data/mongodb'
import * as utils from '../lib/utils'

// @ts-expect-error
global.sleep = (time: number) => {
  if (time > 2000) {
    time = 2000
  }
  const stop = new Date().getTime()
  while (new Date().getTime() < stop + time) {
    ;
  }
}

export function showProductReviews () {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = utils.trunc(req.params.id, 40)

    db.reviewsCollection.find({ $where: 'this.product == ' + id }).then((reviews: Review[]) => {
      const user = security.authenticatedUsers.from(req)
      for (let i = 0; i < reviews.length; i++) {
        if (user === undefined || reviews[i].likedBy.includes(user.data.email)) {
          reviews[i].liked = true
        }
      }
      res.json(utils.queryResultToJson(reviews))
    }, () => {
      res.status(400).json({ error: 'Wrong Params' })
    })
  }
}
