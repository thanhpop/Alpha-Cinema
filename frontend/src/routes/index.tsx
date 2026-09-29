import React from "react";
import { Routes, Route } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import MoviePage from "@/pages/admin/Movie/Movie";

import NotFoundPage from "@/pages/error/error_404.tsx";
import PaymentResult from "@/pages/home/PaymentResult/PaymentResult";
import TheaterPage from "@/pages/admin/Theater/Theater";
import Showtime from "@/pages/admin/Showtime/Showtime";
import HomePage from "@/pages/home/Home/Home";
import Auth from "@/pages/auth/Auth.tsx";
import MovieDetailPage from "@/pages/home/MovieDetail/MovieDetail";
import BookingPage from "@/pages/home/Booking/Booking";
import ReservationPage from "@/pages/admin/Reservation/Reservation";
import ProfilePage from "@/pages/home/ProfilePage/ProfilePage";
import UserManagementPage from "@/pages/admin/User/User";
import ArticlePage from "@/pages/home/ArticlePage/ArticlePage";
import BannerPage from "@/pages/admin/Banner/Banner";
import NewsManagementPage from "@/pages/admin/Article/Article";
import ArticleDetailPage from "@/pages/home/ArticleDetailPage/ArticleDetailPage";
import AdminDashboard from "@/pages/admin/Dashboard/Dashboard";
import MainLayout from "@/layouts/UserLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import GuestRoute from "@/routes/GuestRoute";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Auth />} />
        </Route>

        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/booking/:showtimeId" element={<BookingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/articles" element={<ArticlePage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
      </Route>
      <Route path="/paymentResult" element={<PaymentResult />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="movie" element={<MoviePage />} />
        <Route path="theater" element={<TheaterPage />} />
        <Route path="showtime" element={<Showtime />} />
        <Route path="reservations" element={<ReservationPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="banner" element={<BannerPage />} />
        <Route path="news" element={<NewsManagementPage />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
