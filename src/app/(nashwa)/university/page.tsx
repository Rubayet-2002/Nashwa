import Image from "next/image";
import Link from "next/link";
import pool from "@/database/pool";
import { Store, Pin } from "@mynaui/icons-react";
import { profileData } from "../profile/lib/ProfileData";
import { getUniversityLogo } from "./universityLogo";

export const dynamic = "force-dynamic";

type UniversityRow = {
  university_uid: string;
  university_name: string;
  shop_count: number;
};

export default async function UniversityPage() {
  const profile = await profileData();
  let universities: UniversityRow[] = [];

  try {
    const res = await pool.query(
      `SELECT pu.university_uid,
              pu.university_name,
              COUNT(s.shop_uid)::int AS shop_count
       FROM partner_university pu
       LEFT JOIN shop_join_university sju ON sju.university_uid = pu.university_uid
       LEFT JOIN shop s ON s.shop_uid = sju.shop_uid AND s.status = 'approved'
       GROUP BY pu.university_uid, pu.university_name
       HAVING COUNT(s.shop_uid) > 0
       ORDER BY pu.university_name ASC`
    );

    universities = res.rows;
  } catch (error) {
    console.error("Error loading universities:", error);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#d9eeec] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px] bg-white px-6 py-6 shadow-sm sm:px-8 lg:px-10">
        <header className="border-b border-[#f0f0f0] pb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[#9aa6a3]">category</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#232323]">Universities</h1>
          <p className="mt-2 text-sm text-[#7b7b7b]">
            Explore universities and open their shop lists.
          </p>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {universities.length > 0 ? (
            universities.map((uni) => {
              const isOwnUniversity = profile?.university_uid === uni.university_uid;

              return (
                <article key={uni.university_uid} className="rounded-xl border border-[#ece7e5] px-4 py-4 transition-shadow hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#ece7e5] bg-[#fafafa]">
                        {getUniversityLogo(uni.university_name) ? (
                          <Image
                            src={getUniversityLogo(uni.university_name)!}
                            alt={uni.university_name}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                            <Store size={16} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-[#222222]">{uni.university_name}</h2>
                        <p className="mt-1 text-xs text-[#8a8a8a]">{uni.shop_count} shops</p>
                      </div>
                    </div>

                    {isOwnUniversity ? (
                      <span className="rounded-full bg-[#fff2ef] px-2.5 py-1 text-[11px] font-medium text-[#ba5b55]">
                        Your university
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-[#8a8a8a]">
                      <Pin size={13} className="text-[#BA5B55]" />
                      University shops directory
                    </span>

                    <Link
                      href={`/university/${uni.university_uid}`}
                      className="text-xs font-medium text-[#ba5b55] hover:text-[#9c403a]"
                    >
                      See all shops
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[#e5e5e5] bg-[#fcfcfc] p-8 text-sm text-[#8a8a8a] lg:col-span-2">
              No universities with approved shops found.
            </div>
          )}
        </section>

        <footer className="mt-8 border-t border-[#f2f2f2] pt-4 text-xs text-[#8a8a8a]">
          <span className="inline-flex items-center gap-2">
            <Store size={13} className="text-[#ba5b55]" />
            Click See all shops to open the selected university page.
          </span>
        </footer>
      </div>
    </div>
  );
}