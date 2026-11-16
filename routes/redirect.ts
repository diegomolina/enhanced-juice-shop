import { type Request, type Response, type NextFunction } from 'express'

import * as security from '../lib/security'

export function performRedirect () {
  return ({ query }: Request, res: Response, next: NextFunction) => {
    const toUrl: string = query.to as string
    if (security.isRedirectAllowed(toUrl)) {
      res.redirect(toUrl)
    } else {
      res.status(406)
      next(new Error('Unrecognized target URL for redirect: ' + toUrl))
    }
  }
}
