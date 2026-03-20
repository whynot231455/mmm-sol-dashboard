import { Layout } from "./components/Layout";
import { ImportPage } from "./pages/ImportPage";
import { ConnectPage } from "./pages/ConnectPage";
import { MeasurePage } from "./pages/MeasurePage";
import { PredictPage } from "./pages/PredictPage";
import { OptimizePage } from "./pages/OptimizePage";
import { TrainPage } from "./pages/TrainPage";
import { ValidatePage } from "./pages/ValidatePage";
import { CalibratePage } from "./pages/CalibratePage";
import { GeoLiftPage } from "./pages/GeoLiftPage";
import { PipelinesPage } from "./pages/PipelinesPage";
import { DocumentationPage } from "./pages/DocumentationPage";
import { TransformPage } from "./pages/TransformPage";
import { VideoTutorialsPage } from "./pages/VideoTutorialsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ChatPage } from "./pages/ChatPage";
import { useDataStore } from "./store/useDataStore";

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

function App() {
  const { activePage } = useDataStore();

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
      default:
        return <PlaceholderPage title={activePage} />;
    }
  };

  // If we are on the login or signup page, don't show the sidebar layout
  if (activePage === "login" || activePage === "signup") {
    return activePage === "login" ? <LoginPage /> : <SignUpPage />;
  }

  return <Layout activePage={activePage}>{renderPage()}</Layout>;
}

export default App;
