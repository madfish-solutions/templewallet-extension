import * as React from "react";
import PageLayout from "app/layouts/Page";
import WidthContainer from "app/layouts/WidthContainer";

const HomePage: React.FC = () => (
  <PageLayout>
    <WidthContainer className="py-20 flex flex-row items-center justify-center">
      <div
        className="bg-green-100 border-2 border-green-500 text-green-700 p-4 max-w-lg"
        role="alert"
      >
        <p className="font-bold">Home Page</p>
      </div>
    </WidthContainer>
  </PageLayout>
);

export default HomePage;
