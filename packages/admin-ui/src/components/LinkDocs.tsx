import React, { AnchorHTMLAttributes } from "react";
import newTabProps from "utils/newTabProps";
import { BsInfoCircleFill } from "react-icons/bs";

const LinkDocs: React.FC<AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  href,
  children
}) => {
  return (
    <a style={{ display: "inLine" }} href={href} {...newTabProps}>
      <BsInfoCircleFill className="links-icon" />
      {children}
    </a>
  );
};

export default LinkDocs;
