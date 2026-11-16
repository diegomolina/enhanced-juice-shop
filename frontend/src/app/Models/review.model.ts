export interface Review {
  _id: string
  message: string
  author: string
  likesCount?: number
  liked?: boolean
  likedBy?: string[]
}
