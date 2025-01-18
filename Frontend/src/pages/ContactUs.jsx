import { Helmet } from "react-helmet";
import { TextArea, Heading, Input, Text, Img } from "../../components";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import React from "react";

export default function ContactUsPage() {
  return (
    <>
      <Helmet>
        <title>Contact Bhansako Swad - Get In Touch for Recipes & Support</title>
        <meta
          name="description"
          content="Reach out to Bhansako Swad for irresistible recipes, cooking support, and collaboration opportunities. Contact us in Kathmandu, Nepal, or email us anytime."
        />
      </Helmet>
      <div className="w-full bg-white-a700">
        <div className="flex flex-col gap-[220px] lg:gap-[165px] md:gap-[165px] sm:gap-[110px]">
          <div className="flex flex-col items-center">
            <div className="self-stretch bg-gray-100_93 px-6 py-[26px] shadow-xs sm:p-4">
              <div className="mb-[278px] ml-5 flex flex-col items-center gap-[110px] lg:gap-[110px] md:ml-0 md:gap-[82px] sm:gap-[55px]">
                <Header />
                <div className="container-xs flex flex-col items-center gap-4 px-14 lg:px-5 md:px-5">
                  <Text
                    size="text4xl"
                    as="p"
                    className="text-[64px] font-normal lg:text-[48px] md:text-[48px]"
                  >
                    Get In Touch
                  </Text>
                  <Text
                    className="self-stretch text-center text-[20px] font-normal leading-[25px] lg:text-[17px]"
                  >
                    We’ll create irresistible, share-worthy recipes that not
                    only captivate your audience but also inspire engagement and
                    repeat visits. By combining creativity with strategy, we’ll
                    help drive traffic, boost your online presence, and
                    establish your brand as a go-to source for delicious,
                    easy-to-make recipes.
                  </Text>
                </div>
              </div>
            </div>
            <div className="container-xs relative mt-[-270px] lg:px-5 md:px-5">
              <div>
                <div className="flex items-start justify-center md:flex-col">
                  <Text size="textmd" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
