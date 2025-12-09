export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}
