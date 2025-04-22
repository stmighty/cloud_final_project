export interface Frame {
  id: string
  data: string | null
}

export interface Animation {
  id: string
  title: string
  frames: Frame[]
  createdAt: string
  thumbnail: string
}
