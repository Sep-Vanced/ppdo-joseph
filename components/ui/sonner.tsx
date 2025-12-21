// components/ui/sonner.tsx
"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-zinc-900 group-[.toaster]:text-zinc-950 group-[.toaster]:dark:text-zinc-50 group-[.toaster]:border-zinc-200 group-[.toaster]:dark:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-500 group-[.toast]:dark:text-zinc-400",
          actionButton: "group-[.toast]:bg-zinc-900 group-[.toast]:dark:bg-zinc-50 group-[.toast]:text-zinc-50 group-[.toast]:dark:text-zinc-900",
          cancelButton: "group-[.toast]:bg-zinc-100 group-[.toast]:dark:bg-zinc-800 group-[.toast]:text-zinc-500 group-[.toast]:dark:text-zinc-400",
          success: "group-[.toast]:border-[#15803D] group-[.toast]:bg-white group-[.toast]:dark:bg-green-950/20 group-[.toast]:text-green-900 group-[.toast]:dark:text-green-50",
          error: "group-[.toast]:border-red-500 group-[.toast]:dark:border-red-800 group-[.toast]:bg-white group-[.toast]:dark:bg-red-950/20 group-[.toast]:text-red-900 group-[.toast]:dark:text-red-50",
          warning: "group-[.toast]:border-yellow-500 group-[.toast]:dark:border-yellow-800 group-[.toast]:bg-white group-[.toast]:dark:bg-yellow-950/20 group-[.toast]:text-yellow-900 group-[.toast]:dark:text-yellow-50",
          info: "group-[.toast]:border-blue-500 group-[.toast]:dark:border-blue-800 group-[.toast]:bg-white group-[.toast]:dark:bg-blue-950/20 group-[.toast]:text-blue-900 group-[.toast]:dark:text-blue-50",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "#ffffff",
          "--success-border": "#15803D",
          "--success-text": "#14532d",
          "--error-bg": "#ffffff",
          "--error-border": "#ef4444",
          "--error-text": "#7f1d1d",
          "--warning-bg": "#ffffff",
          "--warning-border": "#eab308",
          "--warning-text": "#713f12",
          "--info-bg": "#ffffff",
          "--info-border": "#3b82f6",
          "--info-text": "#1e3a8a",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }