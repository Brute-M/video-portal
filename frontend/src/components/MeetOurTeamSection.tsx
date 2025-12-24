import React from "react";

const teamMembers = [
  {
    name: "Mr. Sushil Sharma",
    role: "Co-Founder & CEO",
    image: "/founder1.jpg",
    cardBg: "bg-white",
    bio:
      "A meticulous and detail-oriented strategist with a deep understanding of business operations has collected over 15 years of experience in various domains. He has a wide background in areas, including real estate, sales and marketing, and IT staffing. His protean experience has made him achieve the positions of Managing Director at CureTech Services and President of sales and marketing at Digital Hub Solutions and a known name in SAR Propbuild. His fresh perspective and boundless creativity are driving the project forward.",
  },
  {
    name: "Mr. Sushil Malik",
    role: "Co-Founder & Director",
    image: "/founder2.jpg",
    cardBg: "bg-white",
    bio:
      "A master communicator with an ability to connect with people and build relationships, he is leading as a Vice president at Digital Hub Solution and Director at Cure Tech Services. He has been in the industry for over 14 years and manages teams and company operations effortlessly. The contribution to sustainability has also been revolutionary with the smart metering solutions at Lighthouse IOT. His extensive knowledge of real estate, digital marketing, and smart metering solutions is opening doors and generating excitement for the project.",
  },
  {
    name: "Mohit Sharma",
    role: "Chief Operating Officer",
    image: "/founder-3.jpg",
    cardBg: "bg-white",
    bio:
      "With nearly 15 years of experience in the arts, entertainment, and broadcast industries, Mohit has transformed creative visions into world-class productions. Known for his keen eye for design and collaborative approach, he has led high-profile live broadcasts and creative campaigns. An MBA from UCLA, he seamlessly blends creativity with strategic leadership to drive BRPL’s growth and innovation.",
  },
];

const MeetOurTeamSection: React.FC = () => {
  return (
    <section className="bg-[#f5f7fb] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl md:text-4xl font-bold text-[#111a45] mb-10 md:mb-14">
          Meet Our Team
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="flex justify-center"
            >
              <div className="bg-transparent max-w-xs w-full flex flex-col group">
                <div className="relative bg-white rounded-3xl shadow-[0_18px_45px_rgba(0,0,0,0.14)] overflow-hidden w-full founder-card">
                  <div className="w-full h-[380px] md:h-[400px] lg:h-[420px] overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  <div className="founder-hover-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute top-0 left-0 right-0 bottom-0 p-6 flex flex-col justify-end">
                      <div className="max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        <p className="text-white/95 text-xs md:text-sm leading-relaxed text-justify">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-[-105px] mx-4 mb-2 bg-white rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.16)] px-6 py-4 text-center transition-all duration-300 group-hover:opacity-0">
                  <h3 className="text-lg md:text-xl font-extrabold text-[#111827] leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 mt-1 leading-snug">
                    {member.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MeetOurTeamSection;
