import { Suspense } from "react";
import SearchResultsClient from "./SearchResultsClient";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[#f2f4f7]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        }>
          <SearchResultsClient />
        </Suspense>
      </div>
    </div>
  );
}
