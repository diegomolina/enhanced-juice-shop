import type { BasketItemModel } from '@juice-shop/models/basketitem'
import type { ComplaintModel } from '@juice-shop/models/complaint'
import type { FeedbackModel } from '@juice-shop/models/feedback'
import type { ProductModel } from '@juice-shop/models/product'
import type { BasketModel } from '@juice-shop/models/basket'
import type { UserModel } from '@juice-shop/models/user'

export const users: Record<string, UserModel> = {}
export const products: Record<string, ProductModel> = {}
export const feedback: Record<string, FeedbackModel> = {}
export const baskets: Record<string, BasketModel> = {}
export const basketItems: Record<string, BasketItemModel> = {}
export const complaints: Record<string, ComplaintModel> = {}
