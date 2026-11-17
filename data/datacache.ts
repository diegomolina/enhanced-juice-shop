import type { BasketItemModel } from '@app/models/basketitem'
import type { ComplaintModel } from '@app/models/complaint'
import type { FeedbackModel } from '@app/models/feedback'
import type { ProductModel } from '@app/models/product'
import type { BasketModel } from '@app/models/basket'
import type { UserModel } from '@app/models/user'

export const users: Record<string, UserModel> = {}
export const products: Record<string, ProductModel> = {}
export const feedback: Record<string, FeedbackModel> = {}
export const baskets: Record<string, BasketModel> = {}
export const basketItems: Record<string, BasketItemModel> = {}
export const complaints: Record<string, ComplaintModel> = {}
