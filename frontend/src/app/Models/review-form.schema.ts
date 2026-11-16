import { maxLength, pattern, required, schema } from '@angular/forms/signals'

export const MAX_REVIEW_LENGTH = 160

export interface ReviewFormModel {
  message: string
}

export const reviewFormSchema = schema<ReviewFormModel>((s) => {
  required(s.message)
  pattern(s.message, /\S/)
  maxLength(s.message, MAX_REVIEW_LENGTH)
})
