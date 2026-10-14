import axios from "axios";

export const getErrorMessage = (err: unknown, fallback: string) => {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  const firstValidationError = Object.values(data?.errors ?? {}).flat()[0];
  return (firstValidationError as string) || data?.message || data?.detail || fallback;
};
