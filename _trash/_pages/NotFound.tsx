import * as React from "react";
import PageLayout from "app/layouts/Page";
import WidthContainer from "app/layouts/WidthContainer";

const HomePage: React.FC = () => (
  <PageLayout>
    <WidthContainer className="py-20 flex flex-row items-center justify-center">
      <div
        className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 max-w-lg"
        role="alert"
      >
        <p className="font-bold">Not Found</p>
        <p>
          The page you are looking for might have been removed had its name
          changed or is temporarily unavailable.
        </p>
      </div>
    </WidthContainer>
  </PageLayout>
);

export default HomePage;
