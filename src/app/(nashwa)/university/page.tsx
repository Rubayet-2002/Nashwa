import Image from "next/image";
import Link from "next/link";
import pool from "@/database/pool";
import { Store, ArrowRight } from "@mynaui/icons-react";

export const dynamic = "force-dynamic";

type UniversityRow = {
  university_uid: string;
  university_name: string;
  logo_url: string | null;
  shop_count: number;
};

export default async function UniversityPage() {
  let universities: UniversityRow[] = [];

  try {
    const res = await pool.query(
      `SELECT pu.university_uid,
              pu.university_name,
              pu.logo_url,
              COUNT(s.shop_uid)::int AS shop_count
       FROM partner_university pu
       LEFT JOIN shop_join_university sju ON sju.university_uid = pu.university_uid AND sju.status = 'approved'
       LEFT JOIN shop s ON s.shop_uid = sju.shop_uid AND s.status = 'approved'
       GROUP BY pu.university_uid, pu.university_name, pu.logo_url
       ORDER BY pu.university_name ASC`
    );
    universities = res.rows;
  } catch (error) {
    console.error("Error loading universities:", error);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f6f4f2] font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0f0e] via-[#2d1614] to-[#BA5B55] px-6 py-14">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#BA5B55]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff8c7a]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#e8a89e] font-bold mb-3">
            Student Communities
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            University
            <br />
            <span className="text-[#e8a89e]">Marketplace</span>
          </h1>
          <p className="mt-4 text-sm text-white/60 max-w-md leading-relaxed font-light">
            Discover campus entrepreneur shops from universities across the country. Browse student-run businesses, support local makers, and find unique products.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs text-white font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {universities.length} {universities.length === 1 ? "University" : "Universities"} Active
            </span>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-xs text-white font-semibold">
              {universities.reduce((acc, u) => acc + u.shop_count, 0)} Shops Joined
            </span>
          </div>
        </div>
      </div>

      {/* University Grid */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {universities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {universities.map((uni) => {
              return (
                <Link
                  key={uni.university_uid}
                  href={`/university/${uni.university_uid}`}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-[#ece7e5] shadow-sm hover:shadow-lg hover:border-[#BA5B55]/30 transition-all duration-300 flex flex-col"
                >
                  {/* Top accent strip */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#BA5B55] via-[#d4786f] to-[#e8a89e] group-hover:from-[#9c403a] group-hover:to-[#BA5B55] transition-all duration-300" />

                  {/* Card Body */}
                  <div className="p-5 flex flex-col gap-4 flex-1">
                    {/* Logo + Name Row */}
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-[#ece7e5] bg-[#fafafa] shadow-xs group-hover:scale-105 transition-transform duration-300">
                        {uni.logo_url ? (
                          <Image
                            src={uni.logo_url}
                            alt={uni.university_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9] text-[#BA5B55]">
                            <Store size={22} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-[#1a1a1a] text-sm leading-snug line-clamp-2 group-hover:text-[#BA5B55] transition-colors duration-200">
                          {uni.university_name}
                        </h2>
                      </div>
                    </div>

                    {/* Stats + CTA */}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#f0f0f0]">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-[#f6f4f2] rounded-full px-3 py-1.5">
                          <Store size={12} className="text-[#BA5B55]" />
                          <span className="text-[11px] font-bold text-[#4f4f4f]">
                            {uni.shop_count} {uni.shop_count === 1 ? "shop" : "shops"}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BA5B55] group-hover:gap-2 transition-all duration-200">
                        View all
                        <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f4ece9] flex items-center justify-center mb-4">
              <Store size={28} className="text-[#BA5B55]/40" />
            </div>
            <p className="text-sm font-semibold text-[#4f4f4f]">No universities yet</p>
            <p className="text-xs text-[#9a9a9a] font-light mt-1 max-w-xs">
              No universities with approved shops found. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
