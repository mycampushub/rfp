/** Canonical type definitions for RFP sections and questions.
 * All three RFP builder/form files import from here. */

export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "multiple_choice"
  | "boolean"
  | "checkbox"
  | "file"

export interface QuestionConstraints {
  maxLength?: number
  minLength?: number
  minValue?: number
  maxValue?: number
  pattern?: string
}

export interface RFPQuestion {
  id: string
  type: QuestionType
  /** The question text shown to the responder. Used as `prompt` in the builder UI and `title` in the API. */
  prompt: string
  /** Optional alias — used in API-level serialisation. */
  title?: string
  description?: string
  required: boolean
  constraints?: QuestionConstraints
  options?: string[]
  order: number
}

export interface RFPSection {
  id: string
  title: string
  description?: string
  isRequired: boolean
  order: number
  questions: RFPQuestion[]
}
