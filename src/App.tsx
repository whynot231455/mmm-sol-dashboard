import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout";
import { SuccessTransition } from "./components/SuccessTransition";
import { useDataStore } from "./store/useDataStore";
import { Loader2 } from "lucide-react";

const ImportPage = lazy(() => import("./pages/ImportPage").then((mod) => ({ default: mod.ImportPage })));
const ConnectPage = lazy(() => import("./pages/ConnectPage").then((mod) => ({ default: mod.ConnectPage })));
const MeasurePage = lazy(() => import("./pages/MeasurePage").then((mod) => ({ default: mod.MeasurePage })));
const PredictPage = lazy(() => import("./pages/PredictPage").then((mod) => ({ default: mod.PredictPage })));
const OptimizePage = lazy(() => import("./pages/OptimizePage").then((mod) => ({ default: mod.OptimizePage })));
const TrainPage = lazy(() => import("./pages/TrainPage").then((mod) => ({ default: mod.TrainPage })));
const ValidatePage = lazy(() => import("./pages/ValidatePage").then((mod) => ({ default: mod.ValidatePage })));
const CalibratePage = lazy(() => import("./pages/CalibratePage").then((mod) => ({ default: mod.CalibratePage })));
const GeoLiftPage = lazy(() => import("./pages/GeoLiftPage").then((mod) => ({ default: mod.GeoLiftPage })));
const PipelinesPage = lazy(() => import("./pages/PipelinesPage").then((mod) => ({ default: mod.PipelinesPage })));
const DocumentationPage = lazy(() => import("./pages/DocumentationPage").then((mod) => ({ default: mod.DocumentationPage })));
const TransformPage = lazy(() => import("./pages/TransformPage").then((mod) => ({ default: mod.TransformPage })));
const VideoTutorialsPage = lazy(() => import("./pages/VideoTutorialsPage").then((mod) => ({ default: mod.VideoTutorialsPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((mod) => ({ default: mod.LoginPage })));
const SignUpPage = lazy(() => import("./pages/SignUpPage").then((mod) => ({ default: mod.SignUpPage })));
const ChatPage = lazy(() => import("./pages/ChatPage").then((mod) => ({ default: mod.ChatPage })));

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto text-center space-y-6 mt-12">
    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight capitalize">
      {title} Page
    </h1>
    <p className="text-slate-600 text-lg">
      This page is under construction. Please provide the design to continue the
      implementation.
    </p>
  </div>
);

import { useDashboardSync } from "./hooks/useDashboardSync";

function App() {
  const { activePage } = useDataStore();
  
  // Enable automatic dashboard state sync to Supabase
  useDashboardSync();

  const renderPage = () => {
    switch (activePage) {
      case "login":
        return <LoginPage />;
      case "signup":
        return <SignUpPage />;
      case "import":
        return <ImportPage />;
      case "connect":
        return <ConnectPage />;
      case "measure":
        return <MeasurePage />;
      case "predict":
        return <PredictPage />;
      case "optimize":
        return <OptimizePage />;
      case "chat":
        return <ChatPage />;
      case "train":
        return <TrainPage />;
      case "validate":
        return <ValidatePage />;
      case "calibrate":
        return <CalibratePage />;
      case "geolift":
        return <GeoLiftPage />;
      case "pipelines":
        return <PipelinesPage />;
      case "transform":
        return <TransformPage />;
      case "video-tutorials":
        return <VideoTutorialsPage />;
      case "documentation":
        return <DocumentationPage />;
      case "success":
        return <SuccessTransition />;
      default:
        return <PlaceholderPage title={activePage} />;
    }
  };

  // If we are on the login, signup, or success page, don't show the sidebar layout
  if (activePage === "login" || activePage === "signup" || activePage === "success") {
    if (activePage === "login") return <LoginPage />;
    if (activePage === "signup") return <SignUpPage />;
    return <SuccessTransition />;
  }

  return (
    <Layout activePage={activePage}>
      <Suspense
        fallback={
          <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading view...
          </div>
        }
      >
        {renderPage()}
      </Suspense>
    </Layout>
  );
}

export default App;
