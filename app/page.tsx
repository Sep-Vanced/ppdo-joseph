// app/page.tsx

import Link from "next/link";

const Page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Link href="/dashboard" className="font-bold text-lg">
        Click here to go to Dashboard
      </Link>
    </div>
  );
};

export default Page;
