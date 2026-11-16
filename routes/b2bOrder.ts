import vm from 'node:vm'
import { type Request, type Response, type NextFunction } from 'express'
// @ts-expect-error
import { eval as evaluate } from 'notevil'

import * as security from '../lib/security'
import * as utils from '../lib/utils'

export function b2bOrder () {
  return ({ body }: Request, res: Response, next: NextFunction) => {
    const orderLinesData = body.orderLinesData || ''
    try {
      const sandbox = { evaluate, orderLinesData }
      vm.createContext(sandbox)
      vm.runInContext('evaluate(orderLinesData)', sandbox, { timeout: 2000 })
      res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
    } catch (err) {
      if (utils.getErrorMessage(err).match(/Script execution timed out.*/) != null) {
        res.status(503)
        next(new Error('Sorry, we are temporarily not available! Please try again later.'))
      } else {
        next(err)
      }
    }
  }

  function uniqueOrderNumber () {
    return security.hash(`${(new Date()).toString()}_B2B`)
  }

  function dateTwoWeeksFromNow () {
    return new Date(new Date().getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString()
  }
}
