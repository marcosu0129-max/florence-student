import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Professors from './pages/Professors';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ProfessorDetail from './pages/ProfessorDetail';
import CourseDetail from './pages/CourseDetail';
import AddReview from './pages/AddReview';
import AddProfessorReview from './pages/AddProfessorReview';
import Profile from './pages/Profile';
import SavedCourses from './pages/SavedCourses';
import ProgramDetail from './pages/ProgramDetail';
import About from './pages/About';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import MyCourses from './pages/MyCourses';
import MyReviews from './pages/MyReviews';
import AllReviews from './pages/AllReviews';
import Welcome from './pages/Welcome';
import Materials from './pages/Materials';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] as const } },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Home /></motion.div>} />
        <Route path="/login" element={<motion.div key="login" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Login /></motion.div>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/courses" element={<motion.div key="courses" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Courses /></motion.div>} />
        <Route path="/professors" element={<motion.div key="professors" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Professors /></motion.div>} />
        <Route path="/courses/:id" element={<motion.div key="course-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit"><CourseDetail /></motion.div>} />
        <Route path="/courses/:id/review" element={<motion.div key="add-review" variants={pageVariants} initial="initial" animate="animate" exit="exit"><AddReview /></motion.div>} />
        <Route path="/professors/:id" element={<motion.div key="professor-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProfessorDetail /></motion.div>} />
        <Route path="/professors/:id/review" element={<motion.div key="add-professor-review" variants={pageVariants} initial="initial" animate="animate" exit="exit"><AddProfessorReview /></motion.div>} />
        <Route path="/programs/:code" element={<motion.div key="program-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ProgramDetail /></motion.div>} />
        <Route path="/profile" element={<motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Profile /></motion.div>} />
        <Route path="/profile/saved" element={<motion.div key="saved-courses" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SavedCourses /></motion.div>} />
        <Route path="/profile/about" element={<motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit"><About /></motion.div>} />
        <Route path="/profile/settings" element={<motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Settings /></motion.div>} />
        <Route path="/notifications" element={<motion.div key="notifications" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Notifications /></motion.div>} />
        <Route path="/my-courses" element={<motion.div key="my-courses" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MyCourses /></motion.div>} />
        <Route path="/my-reviews" element={<motion.div key="my-reviews" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MyReviews /></motion.div>} />
        <Route path="/all-reviews" element={<motion.div key="all-reviews" variants={pageVariants} initial="initial" animate="animate" exit="exit"><AllReviews /></motion.div>} />
        <Route path="/welcome" element={<motion.div key="welcome" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Welcome /></motion.div>} />
        <Route path="/materials" element={<motion.div key="materials" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Materials /></motion.div>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
