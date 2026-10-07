import { LayoutGroup, MotionConfig } from 'motion/react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PageErrorBoundary from './components/PageErrorBoundary';
const SchoolOtherPrograms = lazy(() => import('./pages/SchoolOtherPrograms'));
const SchoolOtherProgramDetail = lazy(() => import('./pages/SchoolOtherProgramDetail'));
const SchoolOtherDirectory = lazy(() => import('./pages/SchoolOtherDirectory'));
const SchoolOtherDocument = lazy(() => import('./pages/SchoolOtherDocument'));
const SchoolSearch = lazy(() => import('./pages/SchoolSearch'));
const Courses = lazy(() => import('./pages/Courses'));
const Professors = lazy(() => import('./pages/Professors'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ProfessorDetail = lazy(() => import('./pages/ProfessorDetail'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AddReview = lazy(() => import('./pages/AddReview'));
const AddProfessorReview = lazy(() => import('./pages/AddProfessorReview'));
const Profile = lazy(() => import('./pages/Profile'));
const SavedCourses = lazy(() => import('./pages/SavedCourses'));
const ProgramDetail = lazy(() => import('./pages/ProgramDetail'));
const About = lazy(() => import('./pages/About'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const AllReviews = lazy(() => import('./pages/AllReviews'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Materials = lazy(() => import('./pages/Materials'));
const Admin = lazy(() => import('./pages/Admin'));
import { CatalogProvider } from './contexts/CatalogContext';
const NotFound = lazy(() => import('./pages/NotFound'));

function AppRoutes() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/other-programs" element={<SchoolOtherPrograms />} />
        <Route path="/other-programs/directory/:id" element={<SchoolOtherDirectory />} />
        <Route path="/other-programs/documents/:id" element={<SchoolOtherDocument />} />
        <Route path="/other-programs/:id" element={<SchoolOtherProgramDetail />} />
        <Route path="/search" element={<SchoolSearch />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/professors" element={<Professors />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:id/review" element={<AddReview />} />
        <Route path="/professors/:id" element={<ProfessorDetail />} />
        <Route path="/professors/:id/review" element={<AddProfessorReview />} />
        <Route path="/programs/:code" element={<ProgramDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/saved" element={<SavedCourses />} />
        <Route path="/profile/about" element={<About />} />
        <Route path="/profile/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route path="/my-reviews" element={<MyReviews />} />
        <Route path="/all-reviews" element={<AllReviews />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

export default function App() {
  return (
    <PageErrorBoundary><BrowserRouter>
      <CatalogProvider><MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: "easeOut" }}><LayoutGroup><Suspense fallback={<p role="status" className="p-8 text-text">Caricamento pagina…</p>}><AppRoutes /></Suspense></LayoutGroup></MotionConfig></CatalogProvider>
    </BrowserRouter></PageErrorBoundary>
  );
}
