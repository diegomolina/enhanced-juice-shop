import config from 'config'
import { type Request, type Response } from 'express'

export function retrieveAppConfiguration () {
  return (_req: Request, res: Response) => {
    const publicConfig = structuredClone(config.util.toObject(config))
    if (publicConfig.application?.chatBot) {
      delete publicConfig.application.chatBot.llmApiUrl
    }
    res.json({ config: publicConfig })
  }
}
