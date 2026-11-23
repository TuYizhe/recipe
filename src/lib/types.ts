export type Group = 'main' | 'side' | 'seasoning'
export type Heat = '' | '小火' | '中火' | '大火'

export interface Ingredient {
  name: string
  /** 写法随意："1 小勺"、"半个"、"适量" */
  amount: string
  group: Group
}

export interface Step {
  text: string
  heat: Heat
  /** "3分钟"、"30秒"，做菜模式会把它变成计时器 */
  time: string
}

export interface Recipe {
  title: string
  /** 标签，第一个是主分类，决定它在目录和翻页里的位置 */
  tags: string[]
  /** 旧数据字段，读取时会转成 tags */
  category?: string
  servings: string
  /** 原教程链接（B站 / 小红书 …） */
  sourceUrl: string
  /** 封面照片在 images 表里的 id */
  coverId: number | null
  /** 海报底色（从照片取色，或按菜名分配） */
  tone: string
  ingredients: Ingredient[]
  steps: Step[]
  tips: string
}

export interface CookLog {
  date: number
  rating: number
  note: string
}
