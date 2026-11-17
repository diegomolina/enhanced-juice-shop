import type { AddressModel } from '@app/models/address'
import type { BasketModel } from '@app/models/basket'
import type { BasketItemModel } from '@app/models/basketitem'
import type { CaptchaModel } from '@app/models/captcha'
import type { CardModel } from '@app/models/card'
import type { DeliveryModel } from '@app/models/delivery'
import type { MemoryModel } from '@app/models/memory'
import type { ProductModel } from '@app/models/product'
import type { RecycleModel } from '@app/models/recycle'
import type { SecurityAnswerModel } from '@app/models/securityAnswer'
import type { SecurityQuestionModel } from '@app/models/securityQuestion'
import type { UserModel } from '@app/models/user'

export type User = UserModel

export type Delivery = DeliveryModel

export type Address = AddressModel

export type Card = CardModel

export type Product = ProductModel

export interface Review {
  text: string
  author: string
  liked: boolean
  likedBy: string[]
}

export type Memory = MemoryModel

export type Recycle = RecycleModel

export type SecurityQuestion = SecurityQuestionModel

export type SecurityAnswer = SecurityAnswerModel

export type Basket = BasketModel

export type BasketItem = BasketItemModel

export type Captcha = CaptchaModel
