"use client"

import type React from "react"

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
          toast:
            "bg-white text-black border border-zinc-300 shadow-lg " +
            "dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800",

          // ✅ HARD OVERRIDE (background + !important)
          description:
            "!bg-white !text-black !opacity-100 px-3 py-2",

          actionButton:
            "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900",

          cancelButton:
            "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",

          success:
            "border-[#15803D] bg-white text-black dark:bg-green-950/20 dark:text-green-50",

          error:
            "border-red-500 bg-white text-black dark:bg-red-950/20 dark:text-red-50",

          warning:
            "border-yellow-500 bg-white text-black dark:bg-yellow-950/20 dark:text-yellow-50",

          info:
            "border-blue-500 bg-white text-black dark:bg-blue-950/20 dark:text-blue-50",
        },
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#000000",
          "--success-bg": "#ffffff",
          "--success-text": "#000000",
          "--error-bg": "#ffffff",
          "--error-text": "#000000",
          "--warning-bg": "#ffffff",
          "--warning-text": "#000000",
          "--info-bg": "#ffffff",
          "--info-text": "#000000",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
