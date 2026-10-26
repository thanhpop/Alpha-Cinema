import type { AgeRating } from "@/types/Movie";

export const AGE_RATINGS: readonly AgeRating[] = ["P", "K", "T13", "T16", "T18"];

export const AGE_RATING_INFO: Record<AgeRating, { description: string; className: string }> = {
  P: {
    description: "Phim được phổ biến đến người xem ở mọi độ tuổi",
    className: "bg-green-600",
  },
  K: {
    description:
      "Phim được phổ biến đến người xem dưới 13 tuổi khi xem cùng cha, mẹ hoặc người giám hộ",
    className: "bg-sky-600",
  },
  T13: {
    description: "Phim được phổ biến đến người xem từ đủ 13 tuổi trở lên",
    className: "bg-yellow-500",
  },
  T16: {
    description: "Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên",
    className: "bg-orange-500",
  },
  T18: {
    description: "Phim được phổ biến đến người xem từ đủ 18 tuổi trở lên",
    className: "bg-red-600",
  },
};
