import * as React from "react";
import classNames from "clsx";

const CardSample: React.FC = () => {
  const tags = ["photography", "travel", "winter"];

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      <img
        className="w-full"
        src="https://tailwindcss.com/img/card-top.jpg"
        alt="Sunset in the mountains"
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">The Coldest Sunset</div>
        <p className="text-gray-700 text-base">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus
          quia, nulla! Maiores et perferendis eaque, exercitationem praesentium
          nihil.
        </p>
      </div>
      <div className="px-6 py-4">
        {tags.map((tag, index, arr) => {
          const last = index === arr.length - 1;
          return (
            <span
              key={tag}
              className={classNames(
                "inline-block px-3 py-1",
                !last && "mr-2",
                "bg-gray-200 rounded-full",
                "text-sm font-semibold text-gray-700"
              )}
            >
              {`#${tag}`}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default CardSample;
