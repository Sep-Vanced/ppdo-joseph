// components/AccessDeniedPage.tsx

"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldX, CheckCircle2 } from "lucide-react";

interface AccessDeniedPageProps {
  userName?: string;
  userEmail?: string;
  departmentName?: string;
  pageRequested?: string;
}

export default function AccessDeniedPage({
  userName = "",
  userEmail = "",
  departmentName = "Not Assigned",
  pageRequested = "Budget Tracking",
}: AccessDeniedPageProps) {
  const router = useRouter();
  const createAccessRequest = useMutation(api.accessRequests.create);
  
  const [accessType, setAccessType] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessType || !reason.trim()) {
      alert("Please select access type and provide a reason");
      return;
    }

    try {
      setIsSubmitting(true);
      await createAccessRequest({
        pageRequested,
        accessType,
        reason,
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting access request:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to submit access request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <Card className="shadow-lg border-slate-200 dark:border-zinc-800 max-w-md w-full">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
              Request Submitted
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-zinc-400">
              Your access request has been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-zinc-400 text-center">
              An administrator will review your request and respond via email.
              You will be notified once a decision has been made.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Illustration Section */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Background Circle */}
              <circle cx="200" cy="200" r="180" fill="#f1f5f9" />

              {/* Document Stack */}
              <rect
                x="120"
                y="140"
                width="160"
                height="200"
                rx="8"
                fill="#cbd5e1"
              />
              <rect
                x="110"
                y="130"
                width="160"
                height="200"
                rx="8"
                fill="#e2e8f0"
              />
              <rect
                x="100"
                y="120"
                width="160"
                height="200"
                rx="8"
                fill="white"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Document Lines */}
              <line
                x1="120"
                y1="150"
                x2="240"
                y2="150"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="120"
                y1="170"
                x2="220"
                y2="170"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="120"
                y1="190"
                x2="240"
                y2="190"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="120"
                y1="210"
                x2="200"
                y2="210"
                stroke="#cbd5e1"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Shield with X */}
              <circle cx="200" cy="240" r="50" fill="#ef4444" opacity="0.9" />
              <circle cx="200" cy="240" r="42" fill="white" />

              {/* X Mark */}
              <line
                x1="185"
                y1="225"
                x2="215"
                y2="255"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1="215"
                y1="225"
                x2="185"
                y2="255"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Lock Icon */}
              <rect x="190" y="270" width="20" height="25" rx="3" fill="#64748b" />
              <path
                d="M 195 270 L 195 260 A 5 5 0 0 1 205 260 L 205 270"
                stroke="#64748b"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full">
          <Card className="shadow-lg border-slate-200 dark:border-zinc-800">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <ShieldX className="h-6 w-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                    Access Denied
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-zinc-400 mt-1">
                    Authorization Required
                  </CardDescription>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                You do not have permission to view this page. Access to{" "}
                <span className="font-semibold">{pageRequested}</span> is
                limited to authorized personnel. If you require access, please
                complete the form below to submit a request.
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userName}
                    disabled
                    className="bg-slate-100 dark:bg-zinc-800 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-slate-100 dark:bg-zinc-800 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department / Office</Label>
                  <Input
                    id="department"
                    value={departmentName}
                    disabled
                    className="bg-slate-100 dark:bg-zinc-800 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accessType">
                    Access Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={accessType} onValueChange={setAccessType}>
                    <SelectTrigger
                      id="accessType"
                      className="bg-white dark:bg-zinc-900"
                    >
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason for Access <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a brief explanation for your access request"
                    className="bg-white dark:bg-zinc-900 min-h-[100px] resize-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Go Back
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}