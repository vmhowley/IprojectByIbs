export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  /** Author id, to tell own messages apart from names that repeat. */
  userId?: string
  /** Sent from this screen and not yet confirmed by the server. */
  pending?: boolean
}
