// import { useEffect } from "react";
// import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import ProtectedRoute from "./components/ProtectedRoute";
// import AccountLayout from "./components/AccountLayout";
// import AdminLayout from "./components/AdminLayout";

// import Home from "./pages/Home";
// import Products from "./pages/Products";
// import Categories from "./pages/Categories";
// import CategoryDetails from "./pages/CategoryDetails";
// import ProductDetails from "./pages/ProductDetails";
// import Suppliers from "./pages/Suppliers";
// import SupplierDetails from "./pages/SupplierDetails";
// import Requirements from "./pages/Requirements";
// import RequirementDetails from "./pages/RequirementDetails";
// import Insights from "./pages/Insights";
// import InsightDetails from "./pages/InsightDetails";
// import Pricing from "./pages/Pricing";
// import Login from "./pages/Login";
// import ChooseAccount from "./pages/ChooseAccount";
// import NotFound from "./pages/NotFound";

// import BuyerDashboard from "./pages/BuyerDashboard";
// import MyRequirements from "./pages/MyRequirements";
// import PostRequirement from "./pages/PostRequirement";
// import MyProfile from "./pages/MyProfile";

// import SupplierDashboard from "./pages/SupplierDashboard";
// import MyQuotes from "./pages/MyQuotes";
// import SupplierProducts from "./pages/SupplierProducts";
// import SupplierProductForm from "./pages/SupplierProductForm";
// import SupplierEnquiries from "./pages/SupplierEnquiries";
// import SupplierProfile from "./pages/SupplierProfile";

// import AdminDashboard from "./pages/AdminDashboard";
// import AdminRequirements from "./pages/AdminRequirements";
// import AdminQuotes from "./pages/AdminQuotes";
// import AdminCompanies from "./pages/AdminCompanies";
// import AdminCompanyForm from "./pages/AdminCompanyForm";
// import AdminProducts from "./pages/AdminProducts";
// import AdminCategories from "./pages/AdminCategories";
// import AdminProductForm from "./pages/AdminProductForm";
// import AdminUsers from "./pages/AdminUsers";
// import AdminEnquiries from "./pages/AdminEnquiries";
// import InsightsAdmin from "./pages/InsightsAdmin";

// const BUYER = ["buyer", "admin", "super_admin"];
// const SUPPLIER = ["supplier"];
// const ADMIN = ["admin", "super_admin"];

// function PublicLayout() {
//   return (
//     <div className="flex min-h-screen flex-col">
//       <Navbar />
//       <div className="flex-1">
//         <Outlet />
//       </div>
//       <Footer />
//     </div>
//   );
// }

// function ScrollToTop() {
//   const { pathname } = useLocation();
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, [pathname]);
//   return null;
// }

// export default function App() {
//   return (
//     <>
//       <ScrollToTop />
//       <Routes>
//         <Route element={<PublicLayout />}>
//           {/* Public */}
//           <Route path="/" element={<Home />} />
//           <Route path="/products" element={<Products />} />
//           <Route path="/categories" element={<Categories />} />
//           <Route path="/categories/:slug" element={<CategoryDetails />} />
//           <Route path="/products/:id" element={<ProductDetails />} />
//           <Route path="/suppliers" element={<Suppliers />} />
//           <Route path="/suppliers/:id" element={<SupplierDetails />} />
//           <Route path="/requirements" element={<Requirements />} />
//           <Route path="/requirements/:id" element={<RequirementDetails />} />
//           <Route path="/insights" element={<Insights />} />
//           <Route path="/insights/:id" element={<InsightDetails />} />
//           <Route path="/pricing" element={<Pricing />} />
//           <Route path="/login" element={<Login />} />
//           <Route
//             path="/register"
//             element={<Navigate to="/login?mode=register" replace />}
//           />

//           {/* Old URLs */}
//           <Route
//             path="/for-buyers"
//             element={<Navigate to="/suppliers" replace />}
//           />
//           <Route
//             path="/supplier/requirements"
//             element={<Navigate to="/requirements" replace />}
//           />
//           <Route
//             path="/supplier-rfqs"
//             element={<Navigate to="/requirements" replace />}
//           />

//           {/* Any logged-in account */}
//           <Route element={<ProtectedRoute />}>
//             <Route path="/choose-account" element={<ChooseAccount />} />
//             <Route element={<AccountLayout />}>
//               <Route path="/my-profile" element={<MyProfile />} />
//             </Route>
//           </Route>

//           {/* Buyers */}
//           <Route element={<ProtectedRoute roles={BUYER} />}>
//             <Route element={<AccountLayout />}>
//               <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
//               <Route path="/my-requirements" element={<MyRequirements />} />
//               <Route path="/post-requirement" element={<PostRequirement />} />
//               <Route
//                 path="/requirements/:id/edit"
//                 element={<PostRequirement />}
//               />
//             </Route>
//           </Route>

//           {/* Suppliers */}
//           <Route element={<ProtectedRoute roles={SUPPLIER} />}>
//             <Route element={<AccountLayout />}>
//               <Route
//                 path="/supplier/dashboard"
//                 element={<SupplierDashboard />}
//               />
//               <Route path="/my-quotes" element={<MyQuotes />} />
//               <Route path="/supplier/products" element={<SupplierProducts />} />
//               <Route
//                 path="/supplier/products/new"
//                 element={<SupplierProductForm />}
//               />
//               <Route
//                 path="/supplier/products/:id/edit"
//                 element={<SupplierProductForm />}
//               />
//               <Route
//                 path="/supplier/enquiries"
//                 element={<SupplierEnquiries />}
//               />
//               <Route path="/supplier/profile" element={<SupplierProfile />} />
//             </Route>
//           </Route>

//           <Route path="*" element={<NotFound />} />
//         </Route>

//         {/* Admin */}
//         <Route element={<ProtectedRoute roles={ADMIN} />}>
//           <Route element={<AdminLayout />}>
//             <Route
//               path="/admin"
//               element={<Navigate to="/admin/dashboard" replace />}
//             />
//             <Route path="/admin/dashboard" element={<AdminDashboard />} />
//             <Route path="/admin/requirements" element={<AdminRequirements />} />
//             <Route path="/admin/quotes" element={<AdminQuotes />} />
//             <Route path="/admin/companies" element={<AdminCompanies />} />
//             <Route path="/admin/companies/add" element={<AdminCompanyForm />} />
//             <Route
//               path="/admin/companies/:id/edit"
//               element={<AdminCompanyForm />}
//             />
//             <Route path="/admin/products" element={<AdminProducts />} />
//             <Route path="/admin/categories" element={<AdminCategories />} />
//             <Route path="/admin/products/add" element={<AdminProductForm />} />
//             <Route
//               path="/admin/products/:id/edit"
//               element={<AdminProductForm />}
//             />
//             <Route path="/admin/users" element={<AdminUsers />} />
//             <Route path="/admin/enquiries" element={<AdminEnquiries />} />
//             <Route path="/admin/insights" element={<InsightsAdmin />} />
//           </Route>
//         </Route>
//       </Routes>
//     </>
//   );
// }



import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountLayout from "./components/AccountLayout";
import AdminLayout from "./components/AdminLayout";

import Home from "./pages/Home";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import CategoryDetails from "./pages/CategoryDetails";
import ProductDetails from "./pages/ProductDetails";
import Suppliers from "./pages/Suppliers";
import SupplierDetails from "./pages/SupplierDetails";
import Requirements from "./pages/Requirements";
import RequirementDetails from "./pages/RequirementDetails";
import Insights from "./pages/Insights";
import InsightDetails from "./pages/InsightDetails";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import ChooseAccount from "./pages/ChooseAccount";
import NotFound from "./pages/NotFound";

import BuyerDashboard from "./pages/BuyerDashboard";
import MyRequirements from "./pages/MyRequirements";
import PostRequirement from "./pages/PostRequirement";
import MyProfile from "./pages/MyProfile";

import SupplierDashboard from "./pages/SupplierDashboard";
import MyQuotes from "./pages/MyQuotes";
import SupplierProducts from "./pages/SupplierProducts";
import SupplierProductForm from "./pages/SupplierProductForm";
import SupplierEnquiries from "./pages/SupplierEnquiries";
import SupplierProfile from "./pages/SupplierProfile";

import AdminDashboard from "./pages/AdminDashboard";
import AdminRequirements from "./pages/AdminRequirements";
import AdminQuotes from "./pages/AdminQuotes";
import AdminCompanies from "./pages/AdminCompanies";
import AdminCompanyForm from "./pages/AdminCompanyForm";
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminBanners from "./pages/AdminBanners";
import AdminProductForm from "./pages/AdminProductForm";
import AdminUsers from "./pages/AdminUsers";
import AdminEnquiries from "./pages/AdminEnquiries";
import InsightsAdmin from "./pages/InsightsAdmin";

const BUYER = ["buyer", "admin", "super_admin"];
const SUPPLIER = ["supplier"];
const ADMIN = ["admin", "super_admin"];

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<CategoryDetails />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetails />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/requirements/:id" element={<RequirementDetails />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:id" element={<InsightDetails />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* Anyone can post a requirement, logged in or not */}
          <Route
            path="/post-requirement"
            element={
              <main className="container-page max-w-[920px] py-8 lg:py-10">
                <PostRequirement />
              </main>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />

          {/* Old URLs */}
          <Route path="/for-buyers" element={<Navigate to="/suppliers" replace />} />
          <Route path="/supplier/requirements" element={<Navigate to="/requirements" replace />} />
          <Route path="/supplier-rfqs" element={<Navigate to="/requirements" replace />} />

          {/* Any logged-in account */}
          <Route element={<ProtectedRoute />}>
            <Route path="/choose-account" element={<ChooseAccount />} />
            <Route element={<AccountLayout />}>
              <Route path="/my-profile" element={<MyProfile />} />
            </Route>
          </Route>

          {/* Buyers */}
          <Route element={<ProtectedRoute roles={BUYER} />}>
            <Route element={<AccountLayout />}>
              <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
              <Route path="/my-requirements" element={<MyRequirements />} />
              <Route path="/requirements/:id/edit" element={<PostRequirement />} />
            </Route>
          </Route>

          {/* Suppliers */}
          <Route element={<ProtectedRoute roles={SUPPLIER} />}>
            <Route element={<AccountLayout />}>
              <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
              <Route path="/my-quotes" element={<MyQuotes />} />
              <Route path="/supplier/products" element={<SupplierProducts />} />
              <Route path="/supplier/products/new" element={<SupplierProductForm />} />
              <Route path="/supplier/products/:id/edit" element={<SupplierProductForm />} />
              <Route path="/supplier/enquiries" element={<SupplierEnquiries />} />
              <Route path="/supplier/profile" element={<SupplierProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={ADMIN} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/requirements" element={<AdminRequirements />} />
            <Route path="/admin/quotes" element={<AdminQuotes />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
            <Route path="/admin/companies/add" element={<AdminCompanyForm />} />
            <Route path="/admin/companies/:id/edit" element={<AdminCompanyForm />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/products/add" element={<AdminProductForm />} />
            <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/enquiries" element={<AdminEnquiries />} />
            <Route path="/admin/insights" element={<InsightsAdmin />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}