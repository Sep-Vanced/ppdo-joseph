// components/components/Card.tsx

import type React from "react"
import { type CardProps } from "./types" // Import local type

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 ${className}`}>{children}</div>
)