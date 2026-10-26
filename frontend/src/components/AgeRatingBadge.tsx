import React from "react";
import { Tooltip } from "antd";
import type { AgeRating } from "@/types/Movie";
import { AGE_RATING_INFO } from "@/utils/ageRating";

const AgeRatingBadge: React.FC<{ rating?: AgeRating; className?: string }> = ({
  rating,
  className = "",
}) => {
  if (!rating) return null;
  const info = AGE_RATING_INFO[rating];

  return (
    <Tooltip title={info.description}>
      <span
        className={`inline-block rounded px-1.5 py-1 text-xs font-bold leading-none text-white ${info.className} ${className}`}
      >
        {rating}
      </span>
    </Tooltip>
  );
};

export default AgeRatingBadge;
