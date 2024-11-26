import { Fragment } from "react";
import { Footer } from "@components/Footer";

interface Props {
  children: any;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <Fragment>
      <div className="mb-12">{children}</div>
      <Footer />
    </Fragment>
  );
};

export default MainLayout;
