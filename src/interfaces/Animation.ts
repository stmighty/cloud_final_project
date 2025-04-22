export interface Frame {
  id: string
  data: string | null
}

export interface Animation {
  _id: string
  userId: string
  title: string
  frames: Frame[]
  createdAt: string
  thumbnail: string
}
