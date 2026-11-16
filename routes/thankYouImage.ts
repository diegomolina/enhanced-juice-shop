import path from 'node:path'
import { type Request, type Response } from 'express'

export function serveThankYouImage () {
  return (req: Request, res: Response) => {
    res.sendFile(path.resolve('frontend/dist/frontend/assets/private/thank-you.jpg'))
  }
}
