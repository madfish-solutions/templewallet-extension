import classNames from "clsx";
import React from "react";
import Modal from "react-modal";

export type CustomModalProps = Modal.Props & {
  children?: React.ReactChild | React.ReactChild[];
};

const CustomModal: React.FC<CustomModalProps> = (props) => {
  const { className, overlayClassName, ...restProps } = props;

  return (
    <Modal
      {...restProps}
      className={classNames(
        "bg-white border border-gray-500 rounded z-30",
        className
      )}
      appElement={document.getElementById("root")!}
      overlayClassName={classNames(
        "fixed top-0 left-0 right-0 bottom-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-30",
        overlayClassName
      )}
    />
  );
};

export default CustomModal;
