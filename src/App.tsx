import { Layout } from './components/Layout';
import { ImportPage } from './pages/ImportPage';
import { ConnectPage } from './pages/ConnectPage';
import { MeasurePage } from './pages/MeasurePage';
import { PredictPage } from './pages/PredictPage';
import { OptimizePage } from './pages/OptimizePage';
import { TrainPage } from './pages/TrainPage';
import { ValidatePage } from './pages/ValidatePage';
import { CalibratePage } from './pages/CalibratePage';
import { DocumentationPage } from './pages/DocumentationPage';
import { useDataStore } from './store/useDataStore';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto text-center space-y-6 mt-12">
    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight capitalize">
      {title} <span className="text-indigo-600">Page</span>
    </h1>
    <p className="text-slate-600 text-lg">
      This page is under construction. Please provide the design to continue the implementation.
    </p>
  </div>
);

function App() {
  const { activePage } = useDataStore();

  const renderPage = () => {
    switch (activePage) {
      case 'import':
        return <ImportPage />;
      case 'connect':
        return <ConnectPage />;
      case 'measure':
        return <MeasurePage />;
      case 'predict':
        return <PredictPage />;
      case 'optimize':
        return <OptimizePage />;
      case 'train':
        return <TrainPage />;
      case 'validate':
        return <ValidatePage />;
      case 'calibrate':
        return <CalibratePage />;
      case 'transform':
        return <PlaceholderPage title="Data Transformation" />;
      case 'video-tutorials':
        return <PlaceholderPage title="Video Tutorials" />;
      case 'documentation':
        return <DocumentationPage />;
      default:
        return <PlaceholderPage title={activePage} />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  )
}

export default App
