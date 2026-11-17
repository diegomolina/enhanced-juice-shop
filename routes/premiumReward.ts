import path from 'node:path'
import { type Request, type Response } from 'express'

export function servePremiumContent () {
  return (req: Request, res: Response) => {
    res.sendFile(path.resolve('frontend/dist/frontend/assets/private/premium_wallpaper_1920x1080.jpg'))
  }
}
