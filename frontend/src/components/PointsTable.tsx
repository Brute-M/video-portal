import React from "react";

const rows = [
  {
    pos: 1,
    name: "Southern Lions",
    logo: "/1.png",
  },
  {
    pos: 2,
    name: "North East Panthers",
    logo: "/2.png",
  },
  {
    pos: 3,
    name: "Norther Dabanggs",
    logo: "/3.png",
  },
  {
    pos: 4,
    name: "Western Heroes",
    logo: "/4.png",
  },
  {
    pos: 5,
    name: "Central Strikers",
    logo: "/5.png",
  },
  {
    pos: 6,
    name: "Eastern Rhions",
    logo: "/6.png",
  },
];

const PointsTable: React.FC = () => {
  return (
    <section className="relative w-full">
      {/* Background behind table (stadium feel) */}
      <div className="relative py-10 md:py-12 lg:py-14 px-4 md:px-8 lg:px-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/artist.png')" }}
        />
        {/* Light dark tint so background is clearly visible */}
        <div className="absolute inset-0 bg-[#020617]/45" />

        {/* Centered table card over full-width background */}
        <div className="relative max-w-7xl mx-auto">
          {/* Title */}
          <h2
            className="text-center text-white text-3xl md:text-4xl lg:text-[40px] font-extrabold mb-8 md:mb-10 tracking-[0.05em]"
            style={{ fontFamily: "'Rye', serif" }}
          >
            Points Table
          </h2>

          {/* Table wrapper */}
          <div className="overflow-x-auto shadow-[0_18px_55px_rgba(0,0,0,0.7)] pb-2 scrollbar-thin scrollbar-thumb-white/40 scrollbar-track-white/10">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="bg-white">
                <div className="grid grid-cols-[80px_80px_1fr_100px_100px_100px_140px_100px] text-sm font-extrabold tracking-wider uppercase text-[#111a45] items-center">
                  <div className="py-6 text-center">Pos</div>
                  <div className="py-6 text-center"></div> {/* Spacer for Logo */}
                  <div className="py-6 text-left pl-2">Team</div>
                  <div className="py-6 text-center">Play</div>
                  <div className="py-6 text-center">Win</div>
                  <div className="py-6 text-center">Loss</div>
                  <div className="py-6 text-center">Run Rate</div>
                  <div className="py-6 text-center pr-8">Pts</div>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-white/10">
                {rows.map((row, index) => (
                  <div
                    key={row.pos}
                    className={
                      "grid grid-cols-[80px_80px_1fr_100px_100px_100px_140px_100px] text-base text-white items-center h-24 " +
                      (index % 2 === 0
                        ? " bg-[#2d3c84]" // Lighter blue
                        : " bg-[#182046]") // Darker blue
                    }
                  >
                    <div className="font-bold text-xl text-center">{row.pos}</div>

                    <div className="flex items-center justify-center h-full">
                      <div className="h-12 w-12 flex items-center justify-center shrink-0">
                        <img
                          src={row.logo}
                          alt={row.name}
                          className="h-full w-full object-contain drop-shadow-md"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </div>

                    <div className="font-medium text-lg px-2 text-left flex items-center justify-start">
                      {row.name}
                    </div>

                    {[0, 0, 0, 0, 0].map((value, idx) => (
                      <div
                        key={idx}
                        className={
                          "text-center font-medium text-lg" +
                          (idx === 4 ? " pr-8" : "")
                        }
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Styles for Scrollbar (Fallback if Tailwind scrollbar plugin not installed) */}
            <style jsx>{`
              div::-webkit-scrollbar {
                height: 6px;
              }
              div::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 9999px;
              }
              div::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.4);
                border-radius: 9999px;
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PointsTable;
