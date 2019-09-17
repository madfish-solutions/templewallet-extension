import * as React from "react";
import classNames from "clsx";

type GetClassName = (props: ClassNamedProps) => string;

interface ClassNamedProps {
  className?: string;
  as?: React.ElementType;
}

export default function classNamed(className: string | GetClassName) {
  const ClassNamed: React.FC<ClassNamedProps> = props => {
    const { className: restClassName, as: Component = "div", ...rest } = props;

    return (
      <Component
        className={classNames(
          typeof className === "function" ? className(props) : className,
          restClassName
        )}
        {...rest}
      />
    );
  };

  if (process.env.NODE_ENV === "development") {
    ClassNamed.displayName = "ClassNamed";
  }

  return ClassNamed;
}
